-- ============================================================
-- NUFFY — RLS policies + grants
-- ============================================================

-- ---------- public profile table (no sensitive data) ----------

create table if not exists public.profiles_public (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  account_id bigint,
  username text,
  avatar_url text,
  created_at timestamptz
);

create or replace function public.sync_profiles_public()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles_public (user_id, account_id, username, avatar_url, created_at)
  values (new.id, new.account_id, new.username, new.avatar_url, new.created_at)
  on conflict (user_id) do update set
    username = excluded.username,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists profiles_public_sync on public.profiles;
create trigger profiles_public_sync
  after insert or update on public.profiles
  for each row execute procedure public.sync_profiles_public();

revoke all on function public.sync_profiles_public() from public;

-- ---------- explicit grants (Supabase default grants are reverted) ----------

revoke all on table
  public.rarities, public.levels, public.settings,
  public.profiles, public.profiles_public,
  public.collections, public.chips,
  public.chip_instances, public.instance_events,
  public.marketplace_listings, public.purchases,
  public.favorites,
  public.packs, public.pack_versions, public.pack_items,
  public.trades, public.trade_items,
  public.upgrades, public.upgrade_attempts,
  public.balance_transactions,
  public.promo_codes, public.promo_code_uses,
  public.admin_audit_logs
from anon, authenticated;

-- public catalog (anon + authenticated)
grant select on
  public.rarities, public.levels, public.settings,
  public.collections, public.chips,
  public.pack_versions, public.pack_items,
  public.marketplace_listings, public.purchases,
  public.instance_events,
  public.profiles_public
to anon, authenticated;

-- user-owned rows (authenticated only)
grant select on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select on public.chip_instances to authenticated;
grant select on public.balance_transactions to authenticated;
grant select on public.promo_code_uses to authenticated;
grant select on public.trades to authenticated;
grant select on public.trade_items to authenticated;
grant select on public.upgrades to authenticated;
grant select on public.upgrade_attempts to authenticated;
grant select on public.inventory to authenticated;

-- username update (column-level: only this column is updatable by users)
grant update (username) on public.profiles to authenticated;

-- ---------- RLS enable (idempotent) ----------

alter table public.profiles enable row level security;
alter table public.profiles_public enable row level security;
alter table public.rarities enable row level security;
alter table public.levels enable row level security;
alter table public.settings enable row level security;
alter table public.collections enable row level security;
alter table public.chips enable row level security;
alter table public.chip_instances enable row level security;
alter table public.instance_events enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.purchases enable row level security;
alter table public.favorites enable row level security;
alter table public.packs enable row level security;
alter table public.pack_versions enable row level security;
alter table public.pack_items enable row level security;
alter table public.trades enable row level security;
alter table public.trade_items enable row level security;
alter table public.upgrades enable row level security;
alter table public.upgrade_attempts enable row level security;
alter table public.balance_transactions enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_code_uses enable row level security;
alter table public.admin_audit_logs enable row level security;

-- ---------- policies ----------

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_public_select" on public.profiles_public;
create policy "profiles_public_select" on public.profiles_public
  for select using (true);

drop policy if exists "catalog_read" on public.rarities;
create policy "catalog_read" on public.rarities for select using (true);

drop policy if exists "catalog_read" on public.levels;
create policy "catalog_read" on public.levels for select using (true);

drop policy if exists "catalog_read" on public.settings;
create policy "catalog_read" on public.settings for select using (true);

drop policy if exists "collections_read" on public.collections;
create policy "collections_read" on public.collections
  for select using (status in ('active','sold_out','pending'));

drop policy if exists "chips_read" on public.chips;
create policy "chips_read" on public.chips
  for select using (status = 'active');

drop policy if exists "packs_read" on public.packs;
create policy "packs_read" on public.packs
  for select using (status = 'active');

drop policy if exists "pack_versions_read" on public.pack_versions;
create policy "pack_versions_read" on public.pack_versions
  for select using (exists (select 1 from public.packs p where p.id = pack_id and p.status = 'active'));

drop policy if exists "pack_items_read" on public.pack_items;
create policy "pack_items_read" on public.pack_items
  for select using (exists (
    select 1 from public.pack_versions pv
    join public.packs p on p.id = pv.pack_id
    where pv.id = pack_version_id and p.status = 'active'));

drop policy if exists "instances_select_own" on public.chip_instances;
create policy "instances_select_own" on public.chip_instances
  for select using (owner_id = auth.uid());

drop policy if exists "events_read" on public.instance_events;
create policy "events_read" on public.instance_events
  for select using (true);

drop policy if exists "listings_read" on public.marketplace_listings;
create policy "listings_read" on public.marketplace_listings
  for select using (status = 'listed');

drop policy if exists "purchases_read" on public.purchases;
create policy "purchases_read" on public.purchases
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists "favs_own" on public.favorites;
create policy "favs_own" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "trades_read" on public.trades;
create policy "trades_read" on public.trades
  for select using (
    status = 'pending'
    or initiator_id = auth.uid()
    or partner_id = auth.uid()
  );

drop policy if exists "trade_items_read" on public.trade_items;
create policy "trade_items_read" on public.trade_items
  for select using (exists (
    select 1 from public.trades t
    where t.id = trade_id
      and (t.status = 'pending' or t.initiator_id = auth.uid() or t.partner_id = auth.uid())));

drop policy if exists "upgrades_read" on public.upgrades;
create policy "upgrades_read" on public.upgrades
  for select using (user_id = auth.uid());

drop policy if exists "upgrade_attempts_read" on public.upgrade_attempts;
create policy "upgrade_attempts_read" on public.upgrade_attempts
  for select using (exists (
    select 1 from public.upgrades u where u.id = upgrade_id and u.user_id = auth.uid()));

drop policy if exists "txns_read" on public.balance_transactions;
create policy "txns_read" on public.balance_transactions
  for select using (user_id = auth.uid());

drop policy if exists "promo_uses_read" on public.promo_code_uses;
create policy "promo_uses_read" on public.promo_code_uses
  for select using (user_id = auth.uid());

-- ---------- storage ----------

insert into storage.buckets (id, name, public)
values ('chips', 'chips', true), ('packs', 'packs', true), ('collections', 'collections', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "nuffy_public_read" on storage.objects;
create policy "nuffy_public_read" on storage.objects
  for select using (bucket_id in ('chips','packs','collections','avatars'));

drop policy if exists "nuffy_auth_insert" on storage.objects;
create policy "nuffy_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('chips','packs','collections','avatars') and owner = auth.uid());

drop policy if exists "nuffy_auth_update" on storage.objects;
create policy "nuffy_auth_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('chips','packs','collections','avatars') and owner = auth.uid());

drop policy if exists "nuffy_auth_delete" on storage.objects;
create policy "nuffy_auth_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('chips','packs','collections','avatars') and owner = auth.uid());