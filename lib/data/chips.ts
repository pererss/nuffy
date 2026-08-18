import { createSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ChipWithMeta,
  Collection,
  InventoryRow,
  Level,
  Listing,
  Pack,
  PackItem,
  PackVersion,
  ProfilePublic,
  Purchase,
  Rarity,
  Trade,
  Upgrade,
} from "@/lib/types";

export async function getCatalog() {
  const sb = await createSupabase();
  const [rr, ll, cc] = await Promise.all([
    sb.from("rarities").select("*").order("sort_order"),
    sb.from("levels").select("*").order("sort_order"),
    sb.from("collections").select("*").order("released_at", { ascending: false }),
  ]);
  return {
    rarities: (rr.data ?? []) as Rarity[],
    levels: (ll.data ?? []) as Level[],
    collections: (cc.data ?? []) as Collection[],
  };
}

export type ChipFilters = {
  q?: string;
  collection?: string;
  rarity?: string;
  level?: string;
  priceMin?: number;
  priceMax?: number;
  avail?: "in_stock" | "sold_out";
  sort?: "popular" | "price_asc" | "price_desc" | "new" | "rarity" | "edition" | "remaining";
  page?: number;
  pageSize?: number;
  onlyFavs?: boolean;
};

const chipSelect =
  "*, collection:collections(id, name, slug, status), rarity:rarities(id, slug, name, color, sort_order), level:levels(id, name, slug, sort_order, color)";

export async function getShopChips(f: ChipFilters = {}) {
  const sb = await createSupabase();
  const page = Math.max(1, f.page ?? 1);
  const pageSize = f.pageSize ?? 24;

  let query = sb
    .from("chips")
    .select(chipSelect, { count: "exact" })
    .eq("status", "active");

  if (f.q) query = query.ilike("name", `%${f.q}%`);
  if (f.collection) query = query.eq("collection_id", f.collection);
  if (f.rarity) query = query.eq("rarity.slug", f.rarity);
  if (f.level) query = query.eq("level.slug", f.level);
  if (typeof f.priceMin === "number") query = query.gte("base_price", f.priceMin);
  if (typeof f.priceMax === "number") query = query.lte("base_price", f.priceMax);
  if (f.avail === "in_stock") query = query.eq("sold_out", false);
  if (f.avail === "sold_out") query = query.eq("sold_out", true);

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    popular: { col: "sold_count", asc: false },
    price_asc: { col: "base_price", asc: true },
    price_desc: { col: "base_price", asc: false },
    new: { col: "created_at", asc: false },
    rarity: { col: "rarity.sort_order", asc: false },
    edition: { col: "total_minted", asc: false },
    remaining: { col: "sold_count", asc: true },
  };
  const s = sortMap[f.sort ?? "popular"];
  query = query.order(s.col, { ascending: s.asc });

  const { data, count, error } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );
  if (error) throw new Error(error.message);
  return {
    chips: (data ?? []) as ChipWithMeta[],
    total: count ?? 0,
    page,
    pageSize,
    pages: count ? Math.ceil(count / pageSize) : 1,
  };
}

export async function getChip(id: string) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("chips")
    .select(chipSelect)
    .eq("id", id)
    .single();
  return (data ?? null) as ChipWithMeta | null;
}

export async function getAllChips(): Promise<ChipWithMeta[]> {
  const sb = await createSupabase();
  const { data } = await sb
    .from("chips")
    .select(chipSelect)
    .eq("status", "active")
    .order("rarity.sort_order", { ascending: true })
    .order("base_price", { ascending: true })
    .limit(1000);
  return (data ?? []) as ChipWithMeta[];
}

export async function getActivePacks() {
  const sb = await createSupabase();
  const { data } = await sb
    .from("packs")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const now = Date.now();
  return ((data ?? []).filter(
    (p) =>
      (!p.starts_at || new Date(p.starts_at).getTime() <= now) &&
      (!p.ends_at || new Date(p.ends_at).getTime() > now)
  ) as Pack[]);
}

export async function getPack(id: string) {
  const sb = await createSupabase();
  const { data: pack } = await sb.from("packs").select("*").eq("id", id).single();
  if (!pack) return null;
  const { data: version } = await sb
    .from("pack_versions")
    .select("*")
    .eq("pack_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  let items: PackItem[] = [];
  if (version) {
    const { data: it } = await sb
      .from("pack_items")
      .select("*")
      .eq("pack_version_id", (version as { id: string }).id);
    items = (it ?? []) as PackItem[];
  }
  return { pack: pack as Pack, version: (version ?? null) as PackVersion | null, items };
}

const listingSelect =
  "*, instance:chip_instances!inner(chip_id, serial, acquired_at, chip:chips!inner(id, name, number, image_url, image_crop, base_price, rarity:rarities(slug, name, color, sort_order), level:levels(name, slug, sort_order), collection:collections(id, name, slug, total_minted, sold_count)))";

export async function getUsernames(
  ids: string[]
): Promise<Map<string, { username: string; accountId: number }>> {
  const map = new Map<string, { username: string; accountId: number }>();
  if (ids.length === 0) return map;
  const sb = await createSupabase();
  const { data } = await sb
    .from("profiles_public")
    .select("user_id, username, account_id")
    .in("user_id", ids);
  (data ?? []).forEach(
    (p: { user_id: string; username: string; account_id: number }) =>
      map.set(p.user_id, { username: p.username, accountId: p.account_id })
  );
  return map;
}

export async function getListings(f: {
  q?: string;
  rarity?: string;
  collection?: string;
  priceMin?: number;
  priceMax?: number;
  seller?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  chipId?: string;
} = {}) {
  const sb = await createSupabase();
  const page = Math.max(1, f.page ?? 1);
  const pageSize = f.pageSize ?? 24;

  let query = sb
    .from("marketplace_listings")
    .select(listingSelect, { count: "exact" })
    .eq("status", "listed");

  if (f.q) query = query.ilike("instance.chip.name", `%${f.q}%`);
  if (f.rarity) query = query.eq("instance.chip.rarity.slug", f.rarity);
  if (f.collection) query = query.eq("instance.chip.collection.id", f.collection);
  if (typeof f.priceMin === "number") query = query.gte("price", f.priceMin);
  if (typeof f.priceMax === "number") query = query.lte("price", f.priceMax);
  if (f.seller) query = query.ilike("seller.username", `%${f.seller}%`);
  if (f.chipId) query = query.eq("instance.chip_id", f.chipId);

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    new: { col: "listed_at", asc: false },
    price_asc: { col: "price", asc: true },
    price_desc: { col: "price", asc: false },
    rarity: { col: "instance.chip.rarity.sort_order", asc: false },
    level: { col: "instance.chip.level.sort_order", asc: false },
  };
  const s = sortMap[f.sort ?? "new"];
  query = query.order(s.col, { ascending: s.asc });

  const { data, count, error } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );
  if (error) throw new Error(error.message);
  return {
    listings: (data ?? []) as Listing[],
    total: count ?? 0,
    page,
    pages: count ? Math.ceil(count / pageSize) : 1,
  };
}

export async function getListing(id: string) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("marketplace_listings")
    .select(listingSelect)
    .eq("id", id)
    .single();
  return (data ?? null) as Listing | null;
}

export async function getMyListings(userId: string, limit = 50) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("marketplace_listings")
    .select(listingSelect)
    .eq("seller_id", userId)
    .order("listed_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Listing[];
}

export async function getInventory(userId: string) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("inventory")
    .select("*")
    .eq("owner_id", userId)
    .order("acquired_at", { ascending: false });
  return (data ?? []) as InventoryRow[];
}

export async function getMyInstancesOfChip(userId: string, chipId: string) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("chip_instances")
    .select("*")
    .eq("owner_id", userId)
    .eq("chip_id", chipId);
  return (data ?? []) as Array<{
    id: string;
    serial: number;
    status: string;
    acquired_at: string;
    acquired_via: string;
    locked_until: string | null;
  }>;
}

export async function getChipSales(chipId: string, limit = 20) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("purchases")
    .select("id, instance_id, amount, type, buyer_id, seller_id, created_at")
    .eq("chip_id", chipId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Purchase[];
}

export async function getChipEvents(chipId: string, limit = 30) {
  const sb = await createSupabase();
  const { data: instanceIds } = await sb
    .from("chip_instances")
    .select("id")
    .eq("chip_id", chipId)
    .limit(500);
  if (!instanceIds || instanceIds.length === 0) return [];
  const { data: events } = await sb
    .from("instance_events")
    .select(
      "id, instance_id, event, from_user_id, to_user_id, meta, created_at"
    )
    .in(
      "instance_id",
      instanceIds.map((i: { id: string }) => i.id)
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return (events ?? []) as Array<{
    id: number;
    instance_id: string;
    event: string;
    from_user_id: string | null;
    to_user_id: string | null;
    meta: Record<string, unknown> | null;
    created_at: string;
  }>;
}

export async function getFavorites(userId: string) {
  const sb = await createSupabase();
  const { data } = await sb.from("favorites").select("chip_id").eq("user_id", userId);
  return new Set((data ?? []).map((f: { chip_id: string }) => f.chip_id));
}

export async function getTradesForUser(userId: string) {
  const sb = await createSupabase();
  const [{ data: asInit }, { data: asPartner }] = await Promise.all([
    sb.from("trades").select("*").eq("initiator_id", userId).order("created_at", { ascending: false }).limit(30),
    sb.from("trades").select("*").eq("partner_id", userId).order("created_at", { ascending: false }).limit(30),
  ]);
  const merged = [...(asInit ?? []), ...(asPartner ?? [])];
  const seen = new Set<string>();
  const unique = merged.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
  unique.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return (unique as Trade[]);
}

export async function getTrade(tradeId: string) {
  const sb = await createSupabase();
  const { data: trade } = await sb.from("trades").select("*").eq("id", tradeId).single();
  if (!trade) return null;
  const { data: items } = await sb
    .from("trade_items")
    .select(
      "id, instance_id, giver_id, instance:chip_instances(serial, chip:chips(id, name, image_url, image_crop, number, base_price, total_minted, sold_count, status, created_at, collection_id, rarity_id, level_id, collection:collections(id, name, slug, status), rarity:rarities(id, slug, name, color, sort_order), level:levels(id, name, slug, sort_order, color)))"
    )
    .eq("trade_id", tradeId);
  return {
    trade: trade as Trade,
    items: (items ?? []).map((i) => {
      const inst = i.instance as {
        serial?: unknown;
        chip?: unknown;
      } | null;
      return {
        instance_id: String(i.instance_id),
        serial: Number(inst?.serial ?? 0),
        chip: inst?.chip as ChipWithMeta,
      };
    }),
  };
}

export async function getMyUpgrades(userId: string, limit = 20) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("upgrades")
    .select(
      "id, balance_spent, chance, created_at, target_chip_id, target:chips!target_chip_id(name, number, rarity:rarities(slug, name, color)), attempt:upgrade_attempts(success, result_instance_id)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<Record<string, any>>).map((u) => {
    const target = Array.isArray(u.target) ? u.target[0] : u.target;
    const attempt = Array.isArray(u.attempt) ? u.attempt : [];
    return {
      id: u.id as string,
      user_id: u.user_id as string,
      source_instance_id: u.source_instance_id as string,
      target_chip_id: u.target_chip_id as string,
      balance_spent: Number(u.balance_spent),
      chance: Number(u.chance),
      created_at: u.created_at as string,
      target: target
        ? {
            name: target.name as string,
            number: Number(target.number),
            rarity: (Array.isArray(target.rarity) ? target.rarity[0] : target.rarity) ?? null,
          }
        : null,
      attempt: (attempt as Array<any>).map((a) => ({
        success: Boolean(a.success),
        result_instance_id: (a.result_instance_id as string | null) ?? null,
      })),
    } as Upgrade & {
      target: { name: string; number: number; rarity: { slug: string; name: string; color: string } } | null;
      attempt: Array<{ success: boolean; result_instance_id: string | null }>;
    };
  });
}

export async function getPublicProfile(userId: string) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("profiles_public")
    .select("*")
    .eq("user_id", userId)
    .single();
  return (data ?? null) as ProfilePublic | null;
}

export async function getUserStats(userId: string) {
  const sb = await createSupabase();
  const { data } = await sb
    .from("profiles_public")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  const admin = createAdminClient();
  const [{ count: itemsCount }, { count: listingsCount }, { data: ownedStats }] =
    await Promise.all([
      admin.from("chip_instances").select("id", { count: "exact", head: true }).eq("owner_id", userId).in("status", ["owned", "listed", "traded"]),
      admin.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("seller_id", userId).eq("status", "listed"),
      admin
        .from("chip_instances")
        .select("chip_id")
        .eq("owner_id", userId)
        .in("status", ["owned", "listed", "traded"]),
    ]);
  let bestValue = 0;
  let bestChip = null;
  if (ownedStats && ownedStats.length > 0) {
    const chipIds = [...new Set(ownedStats.map((o) => o.chip_id))];
    const { data: chips } = await admin
      .from("chips")
      .select("id, name, base_price, rarity:rarities(slug, name, color)")
      .in("id", chipIds)
      .order("base_price", { ascending: false })
      .limit(1);
    if (chips && chips[0]) {
      bestValue = chips[0].base_price;
      bestChip = chips[0];
    }
  }
  return {
    itemsCount: itemsCount ?? 0,
    listingsCount: listingsCount ?? 0,
    bestValue,
    bestChip: bestChip as { name: string; base_price: number; rarity: { slug: string; name: string; color: string } } | null,
  };
}

export async function getBestDrop(userId: string) {
  const admin = createAdminClient();
  const [{ data: purchases }, { data: drops }] = await Promise.all([
    admin
      .from("purchases")
      .select(
        "price, chip:chips(id, name, base_price, image_url, image_crop, collection_id, rarity:rarities(slug, name, color), level:levels(slug, name, color))"
      )
      .eq("buyer_id", userId)
      .order("price", { ascending: false })
      .limit(1),
    admin
      .from("instance_events")
      .select(
        "instance:chip_instances(serial, chip:chips(id, name, base_price, image_url, image_crop, collection_id, rarity:rarities(slug, name, color), level:levels(slug, name, color)))"
      )
      .eq("user_id", userId)
      .eq("event_type", "drop")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const bestFromShop = purchases?.[0]?.chip ?? null;
  const bestFromPack =
    (drops ?? [])
      .map((d) => {
        const inst = d.instance as { chip?: unknown } | null;
        return (inst?.chip as typeof bestFromShop) ?? null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.base_price - a.base_price)[0] ?? null;

  const a = bestFromShop as
    | { name: string; base_price: number; image_url: string | null; image_crop: unknown; rarity: { slug: string; name: string; color: string } }
    | null;
  const b = bestFromPack as typeof a | null;

  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return a.base_price >= b.base_price ? a : b;
}