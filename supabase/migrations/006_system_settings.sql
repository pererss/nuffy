-- 006: system settings — configurable sell lock period + feature flags.
-- Depends on 005 (settings table, mint_instance/transfer_instance, buy_chip, open_pack,
-- buy_listing, create_trade, upgrade_chip). Safe to re-run.

-- ---------- helpers ----------

create or replace function public.sell_lock_days()
returns integer
language sql stable
as $$
  select greatest(0, coalesce(
    (select (value ->> 'sell_lock_days')::integer from public.settings where key = 'system'),
    7))
$$;

create or replace function public.system_flag(p_name text)
returns boolean
language sql stable
as $$
  select coalesce(
    (select (value ->> p_name)::boolean from public.settings where key = 'system'),
    true)
$$;

-- ---------- seed system settings ----------

insert into public.settings (key, value) values
  ('system', '{"sell_lock_days": 7, "shop_enabled": true, "marketplace_enabled": true, "trades_enabled": true, "upgrades_enabled": true}')
on conflict (key) do nothing;

-- ---------- buy_chip: flag + dynamic lock ----------

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
  if not public.system_flag('shop_enabled') then raise exception 'feature_disabled:shop'; end if;

  v_user := public.lock_user(v_uid);

  select * into v_chip from public.chips where id = p_chip_id for update;
  if not found then raise exception 'chip_not_found'; end if;
  if v_chip.status <> 'active' then raise exception 'chip_not_available'; end if;

  v_price := v_chip.base_price;
  if v_user.balance < v_price then raise exception 'insufficient_balance'; end if;

  update public.profiles set balance = balance - v_price where id = v_uid;

  v_instance_id := public.mint_instance(v_chip.id, v_uid, 'shop', public.sell_lock_days());

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

-- ---------- open_pack: flag + dynamic lock ----------

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
  if not public.system_flag('shop_enabled') then raise exception 'feature_disabled:shop'; end if;

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
    v_instance_id := public.mint_instance(v_choice.chip_id, v_uid, 'pack', public.sell_lock_days());
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
        v_instance_id := public.mint_instance(v_item.chip_id, v_uid, 'pack', public.sell_lock_days());
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

-- ---------- buy_listing: flag + dynamic lock ----------

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
  if not public.system_flag('marketplace_enabled') then raise exception 'feature_disabled:marketplace'; end if;

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

  perform public.transfer_instance(v_listing.instance_id, v_uid, 'marketplace', true, public.sell_lock_days());

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

-- ---------- create_trade: flag ----------

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
  if not public.system_flag('trades_enabled') then raise exception 'feature_disabled:trades'; end if;

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

-- ---------- accept_trade: flag ----------

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
  if not public.system_flag('trades_enabled') then raise exception 'feature_disabled:trades'; end if;

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

-- ---------- upgrade_chip: flag + dynamic lock ----------

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
  if not public.system_flag('upgrades_enabled') then raise exception 'feature_disabled:upgrades'; end if;
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
    v_result_instance_id := public.mint_instance(v_target.id, v_uid, 'upgrade', public.sell_lock_days());
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