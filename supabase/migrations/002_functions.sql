-- ============================================================
-- NUFFY — business functions (all critical logic is server-side)
-- ============================================================

-- ---------- helpers ----------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and not p.is_banned
  );
$$;

-- check currently signed-in user; raises if missing/banned
create or replace function public.require_user()
returns uuid
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select * into v_user from public.profiles where id = v_uid;
  if not found then
    raise exception 'profile_not_found';
  end if;
  if v_user.is_banned then
    raise exception 'account_banned';
  end if;
  return v_uid;
end;
$$;

-- lock user row FOR UPDATE (must be called inside a transaction)
create or replace function public.lock_user(p_uid uuid)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  v_user public.profiles%rowtype;
begin
  select * into v_user from public.profiles where id = p_uid for update;
  if not found then
    raise exception 'profile_not_found';
  end if;
  if v_user.is_banned then
    raise exception 'account_banned';
  end if;
  return v_user;
end;
$$;

-- insert an instance + event
create or replace function public.mint_instance(
  p_chip_id uuid,
  p_owner uuid,
  p_via text,
  p_lock_days integer default 7
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_chip public.chips%rowtype;
  v_col public.collections%rowtype;
  v_serial integer;
  v_instance_id uuid;
begin
  select * into v_chip from public.chips where id = p_chip_id for update;
  if not found then raise exception 'chip_not_found'; end if;
  if v_chip.status <> 'active' then raise exception 'chip_not_available'; end if;
  if v_chip.sold_count >= v_chip.total_minted then raise exception 'chip_sold_out'; end if;

  select * into v_col from public.collections where id = v_chip.collection_id for update;
  if not found then raise exception 'collection_not_found'; end if;
  if v_col.status not in ('active','pending') then raise exception 'collection_not_available'; end if;
  if v_col.sold_count >= v_col.total_minted then raise exception 'collection_sold_out'; end if;

  v_serial := v_chip.sold_count + 1;

  update public.chips set sold_count = sold_count + 1 where id = v_chip.id;
  update public.collections
     set sold_count = sold_count + 1,
         status = case when sold_count + 1 >= total_minted then 'sold_out' else status end
   where id = v_col.id;

  insert into public.chip_instances (chip_id, serial, owner_id, status, acquired_at, acquired_via, locked_until)
  values (p_chip_id, v_serial, p_owner, 'owned', now(), p_via, now() + make_interval(days => p_lock_days))
  returning id into v_instance_id;

  insert into public.instance_events (instance_id, event, to_user_id, meta)
  values (v_instance_id, 'minted', p_owner, jsonb_build_object('via', p_via, 'serial', v_serial));

  return v_instance_id;
end;
$$;

-- transfer instance to a new owner; relock = reset the 7-day lock
create or replace function public.transfer_instance(
  p_instance_id uuid,
  p_new_owner uuid,
  p_via text,
  p_relock boolean,
  p_lock_days integer default 7
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_inst public.chip_instances%rowtype;
  v_old_owner uuid;
begin
  select * into v_inst from public.chip_instances where id = p_instance_id for update;
  if not found then raise exception 'instance_not_found'; end if;
  v_old_owner := v_inst.owner_id;

  update public.chip_instances
     set owner_id = p_new_owner,
         status = 'owned',
         acquired_at = case when p_relock then now() else acquired_at end,
         acquired_via = case when p_relock then p_via else acquired_via end,
         locked_until = case when p_relock then now() + make_interval(days => p_lock_days) else locked_until end
   where id = p_instance_id;

  insert into public.instance_events (instance_id, event, from_user_id, to_user_id, meta)
  values (p_instance_id, 'transfer', v_old_owner, p_new_owner,
          jsonb_build_object('via', p_via, 'relocked', p_relock));
end;
$$;

-- -------- sell status --------
-- returns jsonb { allowed, reason, remaining_seconds, listing_id }
-- allowed when: owned by caller, no active listing, 7-day lock passed, collection sold out
create or replace function public.sell_status(p_instance_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inst public.chip_instances%rowtype;
  v_chip public.chips%rowtype;
  v_col public.collections%rowtype;
  v_listing_id uuid;
  v_remaining bigint;
begin
  select * into v_inst from public.chip_instances where id = p_instance_id;
  if not found then return jsonb_build_object('allowed', false, 'reason', 'not_found'); end if;
  if v_inst.owner_id <> v_uid then return jsonb_build_object('allowed', false, 'reason', 'not_owner'); end if;
  if v_inst.status not in ('owned','listed') then return jsonb_build_object('allowed', false, 'reason', 'invalid_status'); end if;

  select id into v_listing_id from public.marketplace_listings
   where instance_id = p_instance_id and status = 'listed';
  if v_listing_id is not null then
    return jsonb_build_object('allowed', false, 'reason', 'already_listed', 'listing_id', v_listing_id);
  end if;

  v_remaining := greatest(0, floor(extract(epoch from (coalesce(v_inst.locked_until, now()) - now()))));
  if v_remaining > 0 then
    return jsonb_build_object('allowed', false, 'reason', 'locked',
      'remaining_seconds', v_remaining);
  end if;

  select * into v_chip from public.chips where id = v_inst.chip_id;
  select * into v_col from public.collections where id = v_chip.collection_id;
  if v_col.sold_count < v_col.total_minted then
    return jsonb_build_object('allowed', false, 'reason', 'collection_not_sold_out');
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

-- ============================================================
-- SHOP
-- ============================================================

create or replace function public.buy_chip(p_chip_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_user public.profiles%rowtype;
  v_chip public.chips%rowtype;
  v_price numeric(14,2);
  v_instance_id uuid;
begin
  v_user := public.lock_user(v_uid);

  select * into v_chip from public.chips where id = p_chip_id for update;
  if not found then raise exception 'chip_not_found'; end if;
  if v_chip.status <> 'active' then raise exception 'chip_not_available'; end if;

  v_price := v_chip.base_price;
  if v_user.balance < v_price then raise exception 'insufficient_balance'; end if;

  update public.profiles set balance = balance - v_price where id = v_uid;

  v_instance_id := public.mint_instance(v_chip.id, v_uid, 'shop', 7);

  insert into public.purchases (instance_id, chip_id, buyer_id, amount, fee, type)
  values (v_instance_id, v_chip.id, v_uid, v_price, 0, 'shop');

  insert into public.balance_transactions
    (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
  values
    (v_uid, 'purchase', -v_price, v_user.balance, v_user.balance - v_price,
     'purchase', v_instance_id::text,
     'Покупка в магазине: ' || v_chip.name);

  return v_instance_id;
end;
$$;

-- ============================================================
-- PACKS (server-side weighted random)
-- ============================================================

create or replace function public.open_pack(p_pack_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_user public.profiles%rowtype;
  v_pack public.packs%rowtype;
  v_ver public.pack_versions%rowtype;
  v_tiers jsonb;
  v_tier jsonb;
  v_tier_weight numeric(12,4);
  v_roll numeric(12,4);
  v_acc numeric(12,4);
  v_tier_id integer;
  v_item record;
  v_items_total numeric(12,4);
  v_weight_acc numeric(12,4);
  v_choice record;
  v_instance_id uuid;
  v_price numeric(14,2);
begin
  v_user := public.lock_user(v_uid);

  select * into v_pack from public.packs where id = p_pack_id for update;
  if not found then raise exception 'pack_not_found'; end if;
  if v_pack.status <> 'active' then raise exception 'pack_not_active'; end if;
  if v_pack.starts_at is not null and v_pack.starts_at > now() then raise exception 'pack_not_started'; end if;
  if v_pack.ends_at is not null and v_pack.ends_at < now() then raise exception 'pack_ended'; end if;
  if v_pack.available_count is not null and v_pack.opened_count >= v_pack.available_count then
    raise exception 'pack_sold_out';
  end if;
  if v_pack.current_version = 0 then raise exception 'pack_no_version'; end if;

  v_price := v_pack.price;
  if v_user.balance < v_price then raise exception 'insufficient_balance'; end if;

  select * into v_ver from public.pack_versions
   where pack_id = p_pack_id and version = v_pack.current_version;
  if not found then raise exception 'pack_no_version'; end if;

  -- 1) pick tier by weight
  v_tiers := v_ver.config -> 'tiers';
  if jsonb_array_length(v_tiers) = 0 then raise exception 'pack_empty_config'; end if;

  v_roll := random() * 100.0;
  v_acc := 0;
  v_tier_id := null;
  for v_tier in select * from jsonb_array_elements(v_tiers) loop
    v_tier_weight := (v_tier ->> 'weight')::numeric(12,4);
    v_acc := v_acc + v_tier_weight;
    if v_roll < v_acc then
      v_tier_id := (v_tier ->> 'tier_id')::integer;
      exit;
    end if;
  end loop;
  if v_tier_id is null then
    -- rounding guard: pick the last tier
    v_tier := (select t from jsonb_array_elements(v_tiers) t order by (t ->> 'tier_id')::integer desc limit 1);
    v_tier_id := (v_tier ->> 'tier_id')::integer;
  end if;

  -- 2) pick a chip inside the tier by weight
  select coalesce(sum(weight), 0) into v_items_total
    from public.pack_items where pack_version_id = v_ver.id and tier_id = v_tier_id;
  if v_items_total <= 0 then raise exception 'pack_tier_empty'; end if;

  v_roll := random() * v_items_total;
  v_weight_acc := 0;
  v_choice := null;
  for v_item in
    select i.chip_id, i.weight from public.pack_items i
     where i.pack_version_id = v_ver.id and i.tier_id = v_tier_id
     order by i.id
  loop
    v_weight_acc := v_weight_acc + v_item.weight;
    if v_roll < v_weight_acc then
      v_choice := v_item;
      exit;
    end if;
  end loop;
  if v_choice is null then
    select i.chip_id, i.weight into v_choice from public.pack_items i
     where i.pack_version_id = v_ver.id and i.tier_id = v_tier_id
     order by i.id desc limit 1;
  end if;

  -- chip must be in stock; fallback: try any in-stock chip in tier
  begin
    v_instance_id := public.mint_instance(v_choice.chip_id, v_uid, 'pack', 7);
  exception when others then
    null;
  end;
  if v_instance_id is null then
    for v_item in
      select i.chip_id, i.weight from public.pack_items i
       where i.pack_version_id = v_ver.id and i.tier_id = v_tier_id
       and exists (select 1 from public.chips c
                   where c.id = i.chip_id and c.status = 'active'
                     and c.sold_count < c.total_minted)
       order by i.weight desc
    loop
      begin
        v_instance_id := public.mint_instance(v_item.chip_id, v_uid, 'pack', 7);
        exit;
      exception when others then
        null;
      end;
    end loop;
  end if;
  if v_instance_id is null then raise exception 'pack_no_chips'; end if;

  update public.packs set opened_count = opened_count + 1 where id = p_pack_id;
  update public.profiles set balance = balance - v_price where id = v_uid;

  insert into public.balance_transactions
    (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
  values
    (v_uid, 'pack', -v_price, v_user.balance, v_user.balance - v_price,
     'pack', v_pack.id::text, 'Открытие пака: ' || v_pack.name);

  return v_instance_id;
end;
$$;

-- ============================================================
-- MARKETPLACE
-- ============================================================

create or replace function public.create_listing(p_instance_id uuid, p_price numeric(14,2))
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_inst public.chip_instances%rowtype;
  v_status jsonb := public.sell_status(p_instance_id);
  v_listing_id uuid;
begin
  if p_price <= 0 then raise exception 'invalid_price'; end if;
  if not (v_status ->> 'allowed')::boolean then
    raise exception 'sale_not_allowed:%', v_status ->> 'reason';
  end if;

  select * into v_inst from public.chip_instances where id = p_instance_id for update;
  if v_inst.owner_id <> v_uid then raise exception 'not_owner'; end if;

  update public.chip_instances set status = 'listed' where id = p_instance_id;

  insert into public.marketplace_listings (instance_id, seller_id, price)
  values (p_instance_id, v_uid, p_price)
  returning id into v_listing_id;

  insert into public.instance_events (instance_id, event, actor_user_id, meta)
  values (p_instance_id, 'listed', v_uid, jsonb_build_object('listing_id', v_listing_id, 'price', p_price));

  return v_listing_id;
end;
$$;

create or replace function public.cancel_listing(p_listing_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_listing public.marketplace_listings%rowtype;
begin
  select * into v_listing from public.marketplace_listings where id = p_listing_id for update;
  if not found then raise exception 'listing_not_found'; end if;
  if v_listing.seller_id <> v_uid and not public.is_admin() then raise exception 'not_owner'; end if;
  if v_listing.status <> 'listed' then raise exception 'listing_not_active'; end if;

  update public.marketplace_listings
     set status = 'cancelled', cancelled_at = now()
   where id = p_listing_id;
  update public.chip_instances set status = 'owned' where id = v_listing.instance_id;

  insert into public.instance_events (instance_id, event, actor_user_id, meta)
  values (v_listing.instance_id, 'unlisted', v_uid, jsonb_build_object('listing_id', p_listing_id));
end;
$$;

create or replace function public.buy_listing(p_listing_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_listing public.marketplace_listings%rowtype;
  v_buyer public.profiles%rowtype;
  v_seller public.profiles%rowtype;
  v_fee numeric(14,2);
  v_amount numeric(14,2);
begin
  select * into v_listing from public.marketplace_listings where id = p_listing_id for update;
  if not found then raise exception 'listing_not_found'; end if;
  if v_listing.status <> 'listed' then raise exception 'listing_not_active'; end if;
  if v_listing.seller_id = v_uid then raise exception 'cannot_buy_own'; end if;

  v_buyer := public.lock_user(v_uid);
  v_seller := public.lock_user(v_listing.seller_id);

  v_amount := v_listing.price;
  select coalesce((select (value ->> 'fee_percent')::numeric(14,2) from public.settings where key = 'marketplace')
                  , 0) into v_fee;
  if v_fee < 0 or v_fee > 100 then v_fee := 0; end if;
  v_fee := round(v_amount * v_fee / 100, 2);

  if v_buyer.balance < v_amount then raise exception 'insufficient_balance'; end if;

  update public.profiles set balance = balance - v_amount where id = v_uid;
  update public.profiles set balance = balance + (v_amount - v_fee) where id = v_listing.seller_id;

  update public.marketplace_listings
     set status = 'sold', sold_at = now()
   where id = p_listing_id;

  perform public.transfer_instance(v_listing.instance_id, v_uid, 'marketplace', true, 7);

  insert into public.purchases (instance_id, listing_id, chip_id, buyer_id, seller_id, amount, fee, type)
  select v_listing.instance_id, v_listing.id, ci.chip_id, v_uid, v_listing.seller_id, v_amount, v_fee, 'marketplace'
    from public.chip_instances ci where ci.id = v_listing.instance_id;

  insert into public.balance_transactions
    (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
  values
    (v_uid, 'marketplace_buy', -v_amount, v_buyer.balance, v_buyer.balance - v_amount,
     'listing', p_listing_id::text, 'Покупка на торговой площадке'),
    (v_listing.seller_id, 'sale', v_amount - v_fee, v_seller.balance, v_seller.balance + (v_amount - v_fee),
     'listing', p_listing_id::text, 'Продажа на торговой площадке');

  return v_listing.instance_id;
end;
$$;

-- ============================================================
-- TRADES (lock transfers with the item)
-- ============================================================

create or replace function public.create_trade(
  p_instance_ids uuid[],
  p_want_chip_ids uuid[],
  p_code text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_instance_id uuid;
  v_chip_id uuid;
  v_trade_id uuid;
  v_code text := upper(coalesce(nullif(p_code,''), ''));
begin
  if array_length(p_instance_ids, 1) is null then raise exception 'no_items'; end if;
  if array_length(p_want_chip_ids, 1) is null then raise exception 'no_wants'; end if;
  if v_code = '' then
    v_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
  end if;
  if exists (select 1 from public.trades where code = v_code and status = 'pending') then
    raise exception 'code_taken';
  end if;

  insert into public.trades (code, initiator_id, wants)
  values (v_code, v_uid, to_jsonb(p_want_chip_ids))
  returning id into v_trade_id;

  foreach v_instance_id in array p_instance_ids loop
    if not exists (
      select 1 from public.chip_instances ci
       where ci.id = v_instance_id and ci.owner_id = v_uid and ci.status = 'owned'
    ) then
      raise exception 'not_ownable:%', v_instance_id;
    end if;
    insert into public.trade_items (trade_id, instance_id, giver_id)
    values (v_trade_id, v_instance_id, v_uid);
  end loop;

  -- block instances from being listed/sold while pending
  update public.chip_instances set status = 'traded' where id = any(p_instance_ids);

  return v_trade_id;
end;
$$;

-- partner accepts: their chips swap with initiator's chips
create or replace function public.accept_trade(p_code text, p_instance_ids uuid[])
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_trade public.trades%rowtype;
  v_init_items record;
  v_partner_item uuid;
  v_chip_id uuid;
  v_ok boolean;
  v_instance_id uuid;
  v_pending uuid[];
begin
  select * into v_trade from public.trades where upper(code) = upper(p_code) for update;
  if not found then raise exception 'trade_not_found'; end if;
  if v_trade.status <> 'pending' then raise exception 'trade_not_pending'; end if;
  if v_trade.initiator_id = v_uid then raise exception 'cannot_accept_own'; end if;
  if v_trade.expires_at < now() then raise exception 'trade_expired'; end if;
  if array_length(p_instance_ids, 1) <> (select count(*) from public.trade_items where trade_id = v_trade.id) then
    raise exception 'items_count_mismatch';
  end if;

  -- every partner instance must exist, be owned, be 'owned' status
  foreach v_instance_id in array p_instance_ids loop
    if not exists (
      select 1 from public.chip_instances ci
       where ci.id = v_instance_id and ci.owner_id = v_uid and ci.status = 'owned'
    ) then
      raise exception 'not_ownable:%', v_instance_id;
    end if;
  end loop;

  -- lock all involved instances in id order (avoid deadlocks)
  for v_instance_id in
    select i.instance_id from public.trade_items i where i.trade_id = v_trade.id
    union
    select unnest(p_instance_ids)
    order by 1
  loop
    select 1 into v_ok from public.chip_instances where id = v_instance_id for update;
    if not found then raise exception 'instance_not_found'; end if;
  end loop;

  -- initiator side
  for v_init_items in
    select i.instance_id, ci.chip_id from public.trade_items i
    join public.chip_instances ci on ci.id = i.instance_id
    where i.trade_id = v_trade.id
  loop
    perform public.transfer_instance(v_init_items.instance_id, v_uid, 'trade', false);
  end loop;

  -- partner side: give any owned chip; if the initiator asked specific chips, map by order
  v_pending := p_instance_ids;
  for v_init_items in
    select i.instance_id, ci.chip_id from public.trade_items i
    join public.chip_instances ci on ci.id = i.instance_id
    where i.trade_id = v_trade.id
  loop
    v_instance_id := (select unnest(v_pending) order by 1 limit 1);
    v_pending := array_remove(v_pending, v_instance_id);
    perform public.transfer_instance(v_instance_id, v_trade.initiator_id, 'trade', false);
  end loop;

  update public.trades set status = 'completed', partner_id = v_uid, completed_at = now()
   where id = v_trade.id;

  insert into public.balance_transactions
    (user_id, type, amount, balance_before, balance_after, description)
  values
    (v_uid, 'trade', 0, (select balance from public.profiles where id = v_uid),
     (select balance from public.profiles where id = v_uid), 'Обмен с ' || v_trade.code),
    (v_trade.initiator_id, 'trade', 0, (select balance from public.profiles where id = v_trade.initiator_id),
     (select balance from public.profiles where id = v_trade.initiator_id), 'Обмен с ' || v_trade.code);

  return v_trade.id;
end;
$$;

create or replace function public.cancel_trade(p_trade_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_trade public.trades%rowtype;
begin
  select * into v_trade from public.trades where id = p_trade_id for update;
  if not found then raise exception 'trade_not_found'; end if;
  if v_trade.initiator_id <> v_uid and not public.is_admin() then raise exception 'not_owner'; end if;
  if v_trade.status <> 'pending' then raise exception 'trade_not_pending'; end if;

  update public.trades set status = 'cancelled' where id = p_trade_id;
  update public.chip_instances set status = 'owned'
   where id in (select instance_id from public.trade_items where trade_id = p_trade_id);
end;
$$;

-- ============================================================
-- UPGRADES (chance computed + rolled on server)
-- ============================================================

create or replace function public.upgrade_chip(
  p_source_instance_id uuid,
  p_target_chip_id uuid,
  p_balance_spent numeric(14,2)
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_user public.profiles%rowtype;
  v_source public.chip_instances%rowtype;
  v_source_chip public.chips%rowtype;
  v_target public.chips%rowtype;
  v_source_value numeric(14,2);
  v_target_value numeric(14,2);
  v_ratio numeric(14,4);
  v_chance numeric(5,2);
  v_rolled numeric;
  v_success boolean;
  v_result_instance_id uuid;
  v_upgrade_id uuid;
  v_balance_after numeric(14,2);
  v_pvp numeric(14,2);
begin
  if p_balance_spent < 0 then raise exception 'invalid_amount'; end if;

  v_user := public.lock_user(v_uid);

  select * into v_source from public.chip_instances where id = p_source_instance_id for update;
  if not found then raise exception 'instance_not_found'; end if;
  if v_source.owner_id <> v_uid then raise exception 'not_owner'; end if;
  if v_source.status not in ('owned','traded') then raise exception 'invalid_status'; end if;

  select * into v_source_chip from public.chips where id = v_source.chip_id;
  select * into v_target from public.chips where id = p_target_chip_id for update;
  if not found then raise exception 'chip_not_found'; end if;
  if v_target.status <> 'active' then raise exception 'chip_not_available'; end if;

  select coalesce((select (value ->> 'upgrade_source_multiplier')::numeric(14,4) from public.settings where key = 'economy'), 0.9)
    into v_pvp;
  v_source_value := round(v_source_chip.base_price * v_pvp, 2);
  v_target_value := v_target.base_price;
  if v_target_value <= 0 then raise exception 'target_free'; end if;

  v_ratio := (v_source_value + p_balance_spent) / v_target_value;
  v_chance := greatest(1, least(95, round(v_ratio * 100, 2)));

  if p_balance_spent > v_user.balance then raise exception 'insufficient_balance'; end if;
  if p_balance_spent > 0 then
    update public.profiles set balance = balance - p_balance_spent where id = v_uid;
    v_balance_after := v_user.balance - p_balance_spent;
  else
    v_balance_after := v_user.balance;
  end if;

  insert into public.upgrades (user_id, source_instance_id, target_chip_id, balance_spent, chance)
  values (v_uid, p_source_instance_id, p_target_chip_id, p_balance_spent, v_chance)
  returning id into v_upgrade_id;

  v_rolled := random() * 100;
  v_success := v_rolled < v_chance;

  if v_success then
    v_result_instance_id := public.mint_instance(v_target.id, v_uid, 'upgrade', 7);
    update public.chip_instances set status = 'upgraded' where id = p_source_instance_id;
  else
    update public.chip_instances set status = 'upgraded' where id = p_source_instance_id;
  end if;

  insert into public.upgrade_attempts (upgrade_id, success, result_instance_id)
  values (v_upgrade_id, v_success, v_result_instance_id);

  insert into public.instance_events (instance_id, event, actor_user_id, meta)
  values (p_source_instance_id, 'upgrade_burned', v_uid,
          jsonb_build_object('success', v_success, 'target_chip_id', p_target_chip_id,
                             'chance', v_chance, 'balance_spent', p_balance_spent));

  if p_balance_spent > 0 then
    insert into public.balance_transactions
      (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
    values
      (v_uid, 'upgrade', -p_balance_spent, v_user.balance, v_balance_after,
       'upgrade', v_upgrade_id::text, 'Апгрейд фишки');
  end if;

  return jsonb_build_object(
    'upgrade_id', v_upgrade_id,
    'success', v_success,
    'chance', v_chance,
    'result_instance_id', v_result_instance_id
  );
end;
$$;

-- ============================================================
-- MONEY / PROMO
-- ============================================================

create or replace function public.request_balance_change(p_type text, p_amount numeric(14,2))
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_user public.profiles%rowtype;
  v_txn_id bigint;
begin
  if p_type not in ('deposit','withdraw') then raise exception 'invalid_type'; end if;
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;

  select * into v_user from public.profiles where id = v_uid for update;

  if p_type = 'withdraw' and v_user.balance < p_amount then
    raise exception 'insufficient_balance';
  end if;

  insert into public.balance_transactions
    (user_id, type, amount, balance_before, balance_after, status, description)
  values
    (v_uid, p_type, case when p_type = 'deposit' then p_amount else -p_amount end,
     v_user.balance, v_user.balance, 'pending',
     case when p_type = 'deposit' then 'Заявка на пополнение' else 'Заявка на вывод' end)
  returning id into v_txn_id;

  return v_txn_id;
end;
$$;

-- admin approves a pending deposit/withdraw request
create or replace function public.resolve_balance_request(p_txn_id bigint, p_approve boolean, p_admin_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_txn public.balance_transactions%rowtype;
  v_user public.profiles%rowtype;
begin
  if not exists (select 1 from public.profiles p
                 where p.id = p_admin_id and p.role = 'admin' and not p.is_banned) then
    raise exception 'forbidden';
  end if;

  select * into v_txn from public.balance_transactions where id = p_txn_id for update;
  if not found then raise exception 'txn_not_found'; end if;
  if v_txn.status <> 'pending' then raise exception 'txn_not_pending'; end if;

  if p_approve then
    v_user := public.lock_user(v_txn.user_id);
    if v_txn.type = 'withdraw' and v_user.balance < abs(v_txn.amount) then
      raise exception 'insufficient_balance';
    end if;
    update public.balance_transactions
       set status = 'completed',
           balance_before = v_user.balance,
           balance_after = v_user.balance + v_txn.amount,
           admin_id = p_admin_id
     where id = p_txn_id;
    update public.profiles set balance = balance + v_txn.amount where id = v_txn.user_id;
  else
    update public.balance_transactions
       set status = 'rejected', admin_id = p_admin_id
     where id = p_txn_id;
  end if;
end;
$$;

create or replace function public.activate_promo(p_code text)
returns numeric(14,2)
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_user public.profiles%rowtype;
  v_promo public.promo_codes%rowtype;
  v_uses integer;
  v_amount numeric(14,2);
  v_txn_id bigint;
begin
  select * into v_promo from public.promo_codes where upper(code) = upper(p_code) for update;
  if not found then raise exception 'promo_not_found'; end if;
  if not v_promo.is_active then raise exception 'promo_inactive'; end if;
  if v_promo.starts_at is not null and v_promo.starts_at > now() then raise exception 'promo_not_started'; end if;
  if v_promo.ends_at is not null and v_promo.ends_at < now() then raise exception 'promo_expired'; end if;
  if v_promo.max_uses > 0 and v_promo.used_count >= v_promo.max_uses then raise exception 'promo_used_up'; end if;

  select count(*) into v_uses from public.promo_code_uses
   where promo_code_id = v_promo.id and user_id = v_uid;
  if v_uses >= v_promo.per_user_limit then raise exception 'promo_claimed'; end if;

  select * into v_user from public.profiles where id = v_uid for update;

  if v_promo.bonus_type = 'percent' then
    v_amount := round(v_user.balance * v_promo.bonus_value / 100, 2);
  else
    v_amount := v_promo.bonus_value;
  end if;
  if v_amount <= 0 then raise exception 'promo_zero'; end if;

  update public.profiles set balance = balance + v_amount where id = v_uid;

  insert into public.balance_transactions
    (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
  values
    (v_uid, 'promo', v_amount, v_user.balance, v_user.balance + v_amount,
     'promo', v_promo.id::text, 'Промокод ' || v_promo.code)
  returning id into v_txn_id;

  insert into public.promo_code_uses (promo_code_id, user_id, amount, balance_transaction_id)
  values (v_promo.id, v_uid, v_amount, v_txn_id);

  update public.promo_codes set used_count = used_count + 1 where id = v_promo.id;

  return v_amount;
end;
$$;

-- ============================================================
-- FAVORITES
-- ============================================================

create or replace function public.toggle_favorite(p_chip_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_fav boolean;
begin
  if exists (select 1 from public.favorites where user_id = v_uid and chip_id = p_chip_id) then
    delete from public.favorites where user_id = v_uid and chip_id = p_chip_id;
    v_fav := false;
  else
    insert into public.favorites (user_id, chip_id) values (v_uid, p_chip_id);
    v_fav := true;
  end if;
  return v_fav;
end;
$$;

-- ============================================================
-- ADMIN: pack version management (probabilities are validated here)
-- ============================================================

create or replace function public.create_pack_version(
  p_pack_id uuid,
  p_tiers jsonb,
  p_items jsonb,
  p_admin_id uuid
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_pack public.packs%rowtype;
  v_version int;
  v_ver_id uuid;
  v_tier jsonb;
  v_tier_sum numeric(12,4) := 0;
  v_rarity_id uuid;
  v_level_present boolean;
  v_level_mismatch int;
  v_items jsonb;
  v_item jsonb;
  v_item_sum numeric(12,4) := 0;
  v_chip public.chips%rowtype;
begin
  if not exists (select 1 from public.profiles p
                 where p.id = p_admin_id and p.role = 'admin' and not p.is_banned) then
    raise exception 'forbidden';
  end if;
  if jsonb_typeof(p_tiers) <> 'array' or jsonb_array_length(p_tiers) = 0 then
    raise exception 'tiers_empty';
  end if;

  -- validate tiers
  for v_tier in select * from jsonb_array_elements(p_tiers) loop
    if (v_tier ->> 'weight')::numeric(12,4) <= 0 then raise exception 'tier_weight_invalid'; end if;
    select id into v_rarity_id from public.rarities r where r.id = (v_tier ->> 'rarity_id')::uuid;
    if v_rarity_id is null then raise exception 'rarity_not_found'; end if;
    v_level_present := v_tier ? 'level_id' and (v_tier ->> 'level_id') is not null and (v_tier ->> 'level_id') <> '';
    if v_level_present and not exists (
      select 1 from public.levels l where l.id = (v_tier ->> 'level_id')::uuid
    ) then
      raise exception 'level_not_found';
    end if;
    v_tier_sum := v_tier_sum + (v_tier ->> 'weight')::numeric(12,4);
  end loop;
  if abs(v_tier_sum - 100) > 0.001 then raise exception 'tiers_sum_not_100:%', v_tier_sum; end if;

  select * into v_pack from public.packs where id = p_pack_id for update;
  if not found then raise exception 'pack_not_found'; end if;

  v_version := v_pack.current_version + 1;

  insert into public.pack_versions (pack_id, version, config)
  values (p_pack_id, v_version, jsonb_build_object('tiers', p_tiers, 'created_by', p_admin_id))
  returning id into v_ver_id;

  -- validate + insert items
  for v_tier in select * from jsonb_array_elements(p_tiers) loop
    v_items := coalesce(jsonb_path_query_array(p_items, format('$[*] ? (@.tier_id == %s)', (v_tier ->> 'tier_id')::int)::jsonpath), '[]'::jsonb);
    if jsonb_array_length(v_items) = 0 then
      delete from public.pack_versions where id = v_ver_id;
      raise exception 'tier_items_empty:%', v_tier ->> 'tier_id';
    end if;
    v_item_sum := 0;
    for v_item in select * from jsonb_array_elements(v_items) loop
      if (v_item ->> 'weight')::numeric(12,4) <= 0 then raise exception 'item_weight_invalid'; end if;
      select * into v_chip from public.chips where id = (v_item ->> 'chip_id')::uuid;
      if not found or v_chip.status <> 'active' then raise exception 'chip_invalid'; end if;
      if v_chip.rarity_id <> (v_tier ->> 'rarity_id')::uuid then
        raise exception 'chip_rarity_mismatch';
      end if;
      v_level_present := v_tier ? 'level_id' and (v_tier ->> 'level_id') is not null and (v_tier ->> 'level_id') <> '';
      if v_level_present and v_chip.level_id <> (v_tier ->> 'level_id')::uuid then
        raise exception 'chip_level_mismatch';
      end if;
      v_item_sum := v_item_sum + (v_item ->> 'weight')::numeric(12,4);

      insert into public.pack_items (pack_version_id, tier_id, chip_id, weight)
      values (v_ver_id, (v_tier ->> 'tier_id')::int, v_chip.id, (v_item ->> 'weight')::numeric(12,4));
    end loop;
    if abs(v_item_sum - 100) > 0.001 then
      delete from public.pack_versions where id = v_ver_id;
      raise exception 'items_sum_not_100:%', v_tier ->> 'tier_id';
    end if;
  end loop;

  update public.packs set current_version = v_version where id = p_pack_id;

  return v_ver_id;
end;
$$;

-- ============================================================
-- Permissions
-- ============================================================

revoke all on function public.is_admin() from public;
revoke all on function public.require_user() from public;
revoke all on function public.lock_user(uuid) from public;
revoke all on function public.mint_instance(uuid, uuid, text, integer) from public;
revoke all on function public.transfer_instance(uuid, uuid, text, boolean, integer) from public;
revoke all on function public.sell_status(uuid) from public;
revoke all on function public.buy_chip(uuid) from public;
revoke all on function public.open_pack(uuid) from public;
revoke all on function public.create_listing(uuid, numeric) from public;
revoke all on function public.cancel_listing(uuid) from public;
revoke all on function public.buy_listing(uuid) from public;
revoke all on function public.create_trade(uuid[], uuid[], text) from public;
revoke all on function public.accept_trade(text, uuid[]) from public;
revoke all on function public.cancel_trade(uuid) from public;
revoke all on function public.upgrade_chip(uuid, uuid, numeric) from public;
revoke all on function public.request_balance_change(text, numeric) from public;
revoke all on function public.activate_promo(text) from public;
revoke all on function public.toggle_favorite(uuid) from public;
revoke all on function public.create_pack_version(uuid, jsonb, jsonb, uuid) from public;
revoke all on function public.touch_updated_at() from public;
revoke all on function public.handle_new_user() from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.sell_status(uuid) to authenticated;
grant execute on function public.buy_chip(uuid) to authenticated;
grant execute on function public.open_pack(uuid) to authenticated;
grant execute on function public.create_listing(uuid, numeric) to authenticated;
grant execute on function public.cancel_listing(uuid) to authenticated;
grant execute on function public.buy_listing(uuid) to authenticated;
grant execute on function public.create_trade(uuid[], uuid[], text) to authenticated;
grant execute on function public.accept_trade(text, uuid[]) to authenticated;
grant execute on function public.cancel_trade(uuid) to authenticated;
grant execute on function public.upgrade_chip(uuid, uuid, numeric) to authenticated;
grant execute on function public.request_balance_change(text, numeric) to authenticated;
grant execute on function public.resolve_balance_request(bigint, boolean, uuid) to authenticated;
grant execute on function public.activate_promo(text) to authenticated;
grant execute on function public.toggle_favorite(uuid) to authenticated;
grant execute on function public.create_pack_version(uuid, jsonb, jsonb, uuid) to authenticated;

-- seed fix: create_pack_version now takes admin id