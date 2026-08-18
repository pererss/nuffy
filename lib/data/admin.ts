import { getAdminSession } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BalanceTransaction, Listing, PromoCode } from "@/lib/types";

export async function getDashboardStats() {
  const { admin } = await getAdminSession();
  const [
    { count: users },
    { data: sold },
    { count: listings },
    { count: pending },
    { count: packsOpened },
    { data: recentTxns },
    { data: recentRequests },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("purchases").select("amount"),
    admin.from("marketplace_listings").select("id", { count: "exact", head: true }).eq("status", "listed"),
    admin
      .from("balance_transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .in("type", ["deposit", "withdraw"]),
    admin.from("instance_events").select("id", { count: "exact", head: true }).eq("event", "drop"),
    admin
      .from("balance_transactions")
      .select("*, user:profiles(username)")
      .order("created_at", { ascending: false })
      .limit(12),
    admin
      .from("balance_transactions")
      .select("*, user:profiles(username)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const turnover = (sold ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0);

  return {
    users: users ?? 0,
    turnover: Math.round(turnover),
    listings: listings ?? 0,
    pendingRequests: pending ?? 0,
    packsOpened: packsOpened ?? 0,
    recentTxns: (recentTxns ?? []) as Array<BalanceTransaction & { user: { username: string } | null }>,
    recentRequests: (recentRequests ?? []) as Array<BalanceTransaction & { user: { username: string } | null }>,
  };
}

export type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  account_id: number;
  balance: number;
  role: string;
  is_banned: boolean;
  banned_at: string | null;
  created_at: string;
  items: number;
};

export async function listUsers(q?: string, page = 1, pageSize = 25) {
  const { admin } = await getAdminSession();

  let query = admin
    .from("profiles")
    .select("id, username, account_id, balance, role, is_banned, banned_at, created_at", {
      count: "exact",
    });

  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    query = query.or(`username.ilike.${like},account_id::text.ilike.${like}`);
  }

  const { data: profiles, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  let emailMap: Record<string, string> = {};
  const { data: authUsers, error: authErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (!authErr && authUsers) {
    authUsers.users.forEach((u) => (emailMap[u.id] = u.email ?? ""));
  }

  let itemsCounts: Record<string, number> = {};
  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length > 0) {
    const { data: agg } = await admin
      .from("chip_instances")
      .select("owner_id")
      .in("owner_id", ids)
      .in("status", ["owned", "listed", "traded"]);
    (agg ?? []).forEach((r) => {
      itemsCounts[r.owner_id as string] = (itemsCounts[r.owner_id as string] ?? 0) + 1;
    });
  }

  return {
    users: (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap[p.id] ?? null,
      items: itemsCounts[p.id] ?? 0,
    })) as AdminUser[],
    total: count ?? 0,
    page,
    pages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function listAuditLogs(limit = 200) {
  const { admin } = await getAdminSession();
  const { data: logs } = await admin
    .from("admin_audit_logs")
    .select("*, admin:profiles(username)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { logs: (logs ?? []) as Array<Record<string, unknown>> };
}

export async function listPendingRequests() {
  const { admin } = await getAdminSession();
  const { data } = await admin
    .from("balance_transactions")
    .select("*, user:profiles(username)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Array<BalanceTransaction & { user: { username: string } | null }>;
}

export async function listTransactions(limit = 100) {
  const { admin } = await getAdminSession();
  const { data } = await admin
    .from("balance_transactions")
    .select("*, user:profiles(username)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Array<BalanceTransaction & { user: { username: string } | null }>;
}

export async function listActiveListings() {
  const { admin } = await getAdminSession();
  const { data } = await admin
    .from("marketplace_listings")
    .select(
      "id, price, created_at, instance:chip_instances(serial, chip:chips(name, base_price), owner:profiles_public(username))"
    )
    .eq("status", "listed")
    .order("created_at", { ascending: false })
    .limit(100);
  return ((data ?? []) as Array<any>).map((l) => {
    const inst = Array.isArray(l.instance) ? l.instance[0] : l.instance;
    return {
      id: l.id as string,
      price: Number(l.price),
      created_at: l.created_at as string,
      instance: inst
        ? {
            serial: Number(inst.serial),
            chip: Array.isArray(inst.chip) ? (inst.chip[0] ?? null) : (inst.chip ?? null),
            owner: Array.isArray(inst.owner) ? (inst.owner[0] ?? null) : (inst.owner ?? null),
          }
        : null,
    };
  });
}

export async function listRecentSales() {
  const { admin } = await getAdminSession();
  const { data } = await admin
    .from("purchases")
    .select(
      "id, price, created_at, buyer:profiles_public(username), chip:chips(name), instance:chip_instances(serial)"
    )
    .order("created_at", { ascending: false })
    .limit(50);
  return ((data ?? []) as Array<any>).map((s) => ({
    id: s.id as string,
    price: Number(s.price),
    created_at: s.created_at as string,
    buyer: Array.isArray(s.buyer) ? (s.buyer[0] ?? null) : (s.buyer ?? null),
    chip: Array.isArray(s.chip) ? (s.chip[0] ?? null) : (s.chip ?? null),
    instance: Array.isArray(s.instance) ? (s.instance[0] ?? null) : (s.instance ?? null),
  }));
}

export async function listPromos() {
  const { admin } = await getAdminSession();
  const { data } = await admin.from("promo_codes").select("*").order("created_at", { ascending: false });
  return (data ?? []) as PromoCode[];
}

export async function listAllChipsAdmin() {
  const { admin } = await getAdminSession();
  const { data } = await admin
    .from("chips")
    .select(
      "*, collection:collections(name, status), rarity:rarities(id, slug, name), level:levels(id, name)"
    )
    .order("created_at", { ascending: false });
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function getPackWithVersions(packId: string) {
  const { admin } = await getAdminSession();
  const [{ data: pack }, { data: versions }] = await Promise.all([
    admin.from("packs").select("*").eq("id", packId).single(),
    admin
      .from("pack_versions")
      .select("*")
      .eq("pack_id", packId)
      .order("version", { ascending: false })
      .limit(30),
  ]);
  return { pack: (pack ?? null) as Record<string, unknown> | null, versions: (versions ?? []) as Array<Record<string, unknown>> };
}