-- ============================================================
-- NUFFY — seed data (demo catalog + demo user + pack + promo)
-- ============================================================
-- To promote yourself to admin after signing in:
--   update public.profiles set role = 'admin' where username = 'your-username';

create extension if not exists pgcrypto;

-- ---------- rarities ----------

insert into public.rarities (slug, name, color, sort_order) values
  ('common', 'Common', '#A8AFBB', 1),
  ('uncommon', 'Uncommon', '#47D38C', 2),
  ('rare', 'Rare', '#4FB3F0', 3),
  ('epic', 'Epic', '#A97CF8', 4),
  ('legendary', 'Legendary', '#F5C651', 5)
on conflict (slug) do nothing;

-- ---------- levels ----------

insert into public.levels (name, slug, sort_order, color, multiplier) values
  ('Level 1', 'level-1', 1, '#9AA3B2', 1.0),
  ('Level 2', 'level-2', 2, '#A8AFBB', 1.5),
  ('Level 3', 'level-3', 3, '#C6CDD6', 2.2),
  ('Level 4', 'level-4', 4, '#E2E6EB', 3.4),
  ('Level 5', 'level-5', 5, '#F5C651', 5.0)
on conflict (slug) do nothing;

-- ---------- settings ----------

insert into public.settings (key, value) values
  ('marketplace', '{"fee_percent": 0}'),
  ('economy', '{"upgrade_source_multiplier": 0.9}')
on conflict (key) do update set value = excluded.value;

-- ---------- collections ----------

insert into public.collections (id, name, slug, description, total_minted, sold_count, released_at, status) values
  ('00000000-0000-0000-0000-000000000001', 'Neon Genesis', 'neon-genesis',
   'Первый тираж NUFFY. Неоновые существа цифрового города.', 1000, 830, now() - interval '30 days', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Obsidian Hall', 'obsidian-hall',
   'Тёмные фишки из глубины дворца обсидиана.', 1000, 690, now() - interval '21 days', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'Verdant Era', 'verdant-era',
   'Эпоха зелени: лесные стражи и древние звери.', 1200, 810, now() - interval '14 days', 'active'),
  ('00000000-0000-0000-0000-000000000004', 'Solar Drift', 'solar-drift',
   'Распроданный тираж. Солнечная дрейфующая коллекция.', 500, 500, now() - interval '60 days', 'sold_out')
on conflict (id) do nothing;

-- ---------- chips (Neon Genesis) ----------

insert into public.chips (id, collection_id, name, number, rarity_id, level_id, base_price, total_minted, sold_count, status) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Cyber Static', 1,
   (select id from rarities where slug='common'), (select id from levels where slug='level-1'), 60, 400, 320, 'active'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Glitch Pup', 2,
   (select id from rarities where slug='common'), (select id from levels where slug='level-2'), 90, 400, 300, 'active'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Neon Bite', 3,
   (select id from rarities where slug='common'), (select id from levels where slug='level-2'), 120, 350, 250, 'active'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Circuit Fox', 4,
   (select id from rarities where slug='uncommon'), (select id from levels where slug='level-2'), 260, 240, 170, 'active'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Hyper Daisy', 5,
   (select id from rarities where slug='uncommon'), (select id from levels where slug='level-3'), 340, 220, 150, 'active'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Prism Cat', 6,
   (select id from rarities where slug='rare'), (select id from levels where slug='level-3'), 900, 90, 55, 'active'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Void Rabbit', 7,
   (select id from rarities where slug='rare'), (select id from levels where slug='level-4'), 1400, 70, 40, 'active'),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Chroma Seraph', 8,
   (select id from rarities where slug='epic'), (select id from levels where slug='level-4'), 3400, 40, 22, 'active'),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Neon Oracle', 9,
   (select id from rarities where slug='legendary'), (select id from levels where slug='level-5'), 12000, 10, 4, 'active')
on conflict (id) do nothing;

-- ---------- chips (Obsidian Hall) ----------

insert into public.chips (id, collection_id, name, number, rarity_id, level_id, base_price, total_minted, sold_count, status) values
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 'Ash Moth', 1,
   (select id from rarities where slug='common'), (select id from levels where slug='level-1'), 70, 380, 270, 'active'),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'Iron Finch', 2,
   (select id from rarities where slug='common'), (select id from levels where slug='level-2'), 110, 360, 250, 'active'),
  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', 'Marble Wolf', 3,
   (select id from rarities where slug='uncommon'), (select id from levels where slug='level-2'), 300, 200, 140, 'active'),
  ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000002', 'Quartz Doe', 4,
   (select id from rarities where slug='uncommon'), (select id from levels where slug='level-3'), 420, 180, 120, 'active'),
  ('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000002', 'Basalt Owl', 5,
   (select id from rarities where slug='rare'), (select id from levels where slug='level-3'), 1050, 80, 48, 'active'),
  ('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000002', 'Onyx Crow', 6,
   (select id from rarities where slug='rare'), (select id from levels where slug='level-4'), 1600, 60, 34, 'active'),
  ('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000002', 'Obsidian Drake', 7,
   (select id from rarities where slug='epic'), (select id from levels where slug='level-4'), 3900, 30, 15, 'active'),
  ('10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000002', 'Crown of Ash', 8,
   (select id from rarities where slug='legendary'), (select id from levels where slug='level-5'), 15000, 8, 3, 'active')
on conflict (id) do nothing;

-- ---------- chips (Verdant Era) ----------

insert into public.chips (id, collection_id, name, number, rarity_id, level_id, base_price, total_minted, sold_count, status) values
  ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000003', 'Sprout Beetle', 1,
   (select id from rarities where slug='common'), (select id from levels where slug='level-1'), 55, 450, 340, 'active'),
  ('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000003', 'Moss Bunny', 2,
   (select id from rarities where slug='common'), (select id from levels where slug='level-2'), 95, 420, 300, 'active'),
  ('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000003', 'Fern Heron', 3,
   (select id from rarities where slug='uncommon'), (select id from levels where slug='level-2'), 250, 240, 160, 'active'),
  ('10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000003', 'Amber Boar', 4,
   (select id from rarities where slug='uncommon'), (select id from levels where slug='level-3'), 380, 200, 130, 'active'),
  ('10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000003', 'Grove Lynx', 5,
   (select id from rarities where slug='rare'), (select id from levels where slug='level-3'), 980, 90, 50, 'active'),
  ('10000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000003', 'Ember Stag', 6,
   (select id from rarities where slug='rare'), (select id from levels where slug='level-4'), 1500, 70, 38, 'active'),
  ('10000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000003', 'Jade Wyrm', 7,
   (select id from rarities where slug='epic'), (select id from levels where slug='level-4'), 3600, 35, 17, 'active'),
  ('10000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000003', 'Old Growth Titan', 8,
   (select id from rarities where slug='legendary'), (select id from levels where slug='level-5'), 13500, 10, 4, 'active')
on conflict (id) do nothing;

-- ---------- chips (Solar Drift — fully sold out) ----------

insert into public.chips (id, collection_id, name, number, rarity_id, level_id, base_price, total_minted, sold_count, status) values
  ('10000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000004', 'Dust Comet', 1,
   (select id from rarities where slug='common'), (select id from levels where slug='level-1'), 65, 200, 200, 'active'),
  ('10000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000004', 'Solar Lark', 2,
   (select id from rarities where slug='common'), (select id from levels where slug='level-2'), 105, 180, 180, 'active'),
  ('10000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000004', 'Magma Koi', 3,
   (select id from rarities where slug='uncommon'), (select id from levels where slug='level-2'), 290, 100, 100, 'active'),
  ('10000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000004', 'Cinder Hare', 4,
   (select id from rarities where slug='uncommon'), (select id from levels where slug='level-3'), 400, 90, 90, 'active'),
  ('10000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000004', 'Flare Condor', 5,
   (select id from rarities where slug='rare'), (select id from levels where slug='level-3'), 1100, 40, 40, 'active'),
  ('10000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000004', 'Helios Lion', 6,
   (select id from rarities where slug='rare'), (select id from levels where slug='level-4'), 1700, 30, 30, 'active'),
  ('10000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000004', 'Sunfall Kraken', 7,
   (select id from rarities where slug='epic'), (select id from levels where slug='level-4'), 4100, 15, 15, 'active'),
  ('10000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000004', 'Heliarch', 8,
   (select id from rarities where slug='legendary'), (select id from levels where slug='level-5'), 16000, 5, 5, 'active')
on conflict (id) do nothing;

-- ---------- packs ----------

insert into public.packs (id, name, description, price, status, available_count, opened_count, current_version, starts_at, ends_at) values
  ('20000000-0000-0000-0000-000000000001', 'Genesis Starter Pack',
   'Стартовый пак с фишками Neon Genesis. Шанс легендарки: 1.5%.',
   250, 'active', 5000, 0, 0, now() - interval '3 days', now() + interval '60 days'),
  ('20000000-0000-0000-0000-000000000002', 'Verdant Booster',
   'Бустер Verdant Era. Повышенный шанс редких фишек.',
   600, 'active', 2000, 0, 0, now() - interval '2 days', now() + interval '45 days')
on conflict (id) do nothing;

-- bootstrap: the seed creates pack versions via the admin-gated function;
-- temporarily promote the demo user, then restore.
update public.profiles set role = 'admin' where id = '30000000-0000-0000-0000-000000000001';

select public.create_pack_version(
  '20000000-0000-0000-0000-000000000001',
  '[
    {"tier_id": 1, "name": "Common", "rarity_id": "' || (select id from public.rarities where slug='common') || '", "weight": 50},
    {"tier_id": 2, "name": "Uncommon", "rarity_id": "' || (select id from public.rarities where slug='uncommon') || '", "weight": 30},
    {"tier_id": 3, "name": "Rare", "rarity_id": "' || (select id from public.rarities where slug='rare') || '", "weight": 13},
    {"tier_id": 4, "name": "Epic", "rarity_id": "' || (select id from public.rarities where slug='epic') || '", "weight": 5.5},
    {"tier_id": 5, "name": "Legendary", "rarity_id": "' || (select id from public.rarities where slug='legendary') || '", "weight": 1.5}
  ]'::jsonb,
  '[
    {"tier_id": 1, "chip_id": "10000000-0000-0000-0000-000000000001", "weight": 40},
    {"tier_id": 1, "chip_id": "10000000-0000-0000-0000-000000000002", "weight": 35},
    {"tier_id": 1, "chip_id": "10000000-0000-0000-0000-000000000003", "weight": 25},
    {"tier_id": 2, "chip_id": "10000000-0000-0000-0000-000000000004", "weight": 55},
    {"tier_id": 2, "chip_id": "10000000-0000-0000-0000-000000000005", "weight": 45},
    {"tier_id": 3, "chip_id": "10000000-0000-0000-0000-000000000006", "weight": 60},
    {"tier_id": 3, "chip_id": "10000000-0000-0000-0000-000000000007", "weight": 40},
    {"tier_id": 4, "chip_id": "10000000-0000-0000-0000-000000000008", "weight": 100},
    {"tier_id": 5, "chip_id": "10000000-0000-0000-0000-000000000009", "weight": 100}
  ]'::jsonb,
  '30000000-0000-0000-0000-000000000001');

select public.create_pack_version(
  '20000000-0000-0000-0000-000000000002',
  '[
    {"tier_id": 1, "name": "Common", "rarity_id": "' || (select id from public.rarities where slug='common') || '", "weight": 40},
    {"tier_id": 2, "name": "Uncommon", "rarity_id": "' || (select id from public.rarities where slug='uncommon') || '", "weight": 30},
    {"tier_id": 3, "name": "Rare", "rarity_id": "' || (select id from public.rarities where slug='rare') || '", "weight": 20},
    {"tier_id": 4, "name": "Epic", "rarity_id": "' || (select id from public.rarities where slug='epic') || '", "weight": 8},
    {"tier_id": 5, "name": "Legendary", "rarity_id": "' || (select id from public.rarities where slug='legendary') || '", "weight": 2}
  ]'::jsonb,
  '[
    {"tier_id": 1, "chip_id": "10000000-0000-0000-0000-000000000021", "weight": 40},
    {"tier_id": 1, "chip_id": "10000000-0000-0000-0000-000000000022", "weight": 35},
    {"tier_id": 2, "chip_id": "10000000-0000-0000-0000-000000000023", "weight": 50},
    {"tier_id": 2, "chip_id": "10000000-0000-0000-0000-000000000024", "weight": 50},
    {"tier_id": 3, "chip_id": "10000000-0000-0000-0000-000000000025", "weight": 55},
    {"tier_id": 3, "chip_id": "10000000-0000-0000-0000-000000000026", "weight": 45},
    {"tier_id": 4, "chip_id": "10000000-0000-0000-0000-000000000027", "weight": 100},
    {"tier_id": 5, "chip_id": "10000000-0000-0000-0000-000000000028", "weight": 100}
  ]'::jsonb,
  '30000000-0000-0000-0000-000000000001');

update public.profiles set role = 'user' where id = '30000000-0000-0000-0000-000000000001';

-- ---------- demo user ----------

insert into auth.users (id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values (
  '30000000-0000-0000-0000-000000000001',
  'demo@nuffy.app',
  crypt('demo123456', gen_salt('bf')),
  '{"username": "demo"}',
  now(), now(), now()
) on conflict (id) do nothing;

insert into public.profiles (id, username, balance)
values (
  '30000000-0000-0000-0000-000000000001',
  'demo',
  5000
)
on conflict (id) do nothing;

-- demo inventory: one sellable item (lock passed), two locked, one from pack
select public.mint_instance('10000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', 'shop')
  ::text is not null as seeded;

update public.chip_instances set locked_until = now() - interval '1 day'
 where chip_id = '10000000-0000-0000-0000-000000000006'
   and owner_id = '30000000-0000-0000-0000-000000000001';

update public.chips set sold_count = sold_count - 1
 where id = '10000000-0000-0000-0000-000000000006';
update public.collections set sold_count = sold_count - 1
 where id = '00000000-0000-0000-0000-000000000001';

select public.mint_instance('10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'pack');
select public.mint_instance('10000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000001', 'shop');

delete from public.purchases where buyer_id = '30000000-0000-0000-0000-000000000001';
delete from public.balance_transactions where user_id = '30000000-0000-0000-0000-000000000001';

-- ---------- promo codes ----------

insert into public.promo_codes (code, bonus_type, bonus_value, max_uses, per_user_limit, is_active, starts_at, ends_at) values
  ('NUFFY100', 'fixed', 100, 500, 1, true, now() - interval '1 day', now() + interval '90 days'),
  ('NUFFY10', 'percent', 10, 500, 1, true, now() - interval '1 day', now() + interval '90 days')
on conflict (code) do nothing;