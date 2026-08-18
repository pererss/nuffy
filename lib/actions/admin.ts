"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateDbError, type Result } from "@/lib/actions/errors";
import { slugify } from "@/lib/utils";
import type {
  AdminAuditLog,
  Collection,
  Chip,
  Pack,
  PromoCode,
} from "@/lib/types";

async function getAdmin() {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/shop");
  return { admin, adminId: profile.id, adminName: profile.username };
}

export async function getAdminSession() {
  const { admin, adminId, adminName } = await getAdmin();
  return { admin, adminId, adminName };
}

async function getIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

async function logAudit(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  action: string,
  entity: string,
  entityId: string | null,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
) {
  try {
    await admin.from("admin_audit_logs").insert({
      admin_id: adminId,
      action,
      entity,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip: await getIp(),
    });
  } catch {
    // audit log must never break the main operation
  }
}

function slugifyName(name: string) {
  return slugify(name) || `item-${Date.now()}`;
}

// ---------------- users ----------------

export async function adminUpdateUsername(
  userId: string,
  username: string
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const clean = username.trim().replace(/\s+/g, "_").slice(0, 32);
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { ok: false, error: "Username: только латиница, цифры и _" };
  }
  const { data: old } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();
  const { error } = await admin
    .from("profiles")
    .update({ username: clean })
    .eq("id", userId);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, "change_username", "user", userId, old, {
    username: clean,
  });
  return { ok: true };
}

export async function adminAdjustBalance(
  userId: string,
  amount: number,
  note?: string
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  if (!amount || Number.isNaN(amount)) return { ok: false, error: "Сумма" };
  const { data: old } = await admin
    .from("profiles")
    .select("balance")
    .eq("id", userId)
    .single();
  if (!old) return { ok: false, error: "Пользователь не найден" };
  const newBalance = old.balance + amount;
  if (newBalance < 0) return { ok: false, error: "Баланс не может быть отрицательным" };
  const { error } = await admin
    .from("profiles")
    .update({ balance: newBalance })
    .eq("id", userId);
  if (error) return { ok: false, error: translateDbError(error.message) };
  const { error: txnError } = await admin.from("balance_transactions").insert({
    user_id: userId,
    type: amount > 0 ? "admin_grant" : "admin_remove",
    amount,
    balance_before: old.balance,
    balance_after: newBalance,
    status: "completed",
    admin_id: adminId,
    description: note ?? null,
  });
  if (txnError) {
    await admin
      .from("profiles")
      .update({ balance: old.balance })
      .eq("id", userId);
    return { ok: false, error: translateDbError(txnError.message) };
  }
  await logAudit(admin, adminId, "adjust_balance", "user", userId, old, {
    balance: newBalance,
    delta: amount,
  });
  return { ok: true };
}

export async function adminIssueChip(
  userId: string,
  chipId: string
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { data, error } = await admin.rpc("mint_instance", {
    p_chip_id: chipId,
    p_owner: userId,
    p_via: "admin",
    p_lock_days: 0,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, "issue_chip", "user", userId, null, {
    instance_id: data,
    chip_id: chipId,
  });
  return { ok: true };
}

export async function adminRemoveInstance(instanceId: string): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { data: old } = await admin
    .from("chip_instances")
    .select("id, owner_id, chip_id, serial")
    .eq("id", instanceId)
    .single();
  if (!old) return { ok: false, error: "Фишка не найдена" };
  const { error } = await admin
    .from("chip_instances")
    .update({ status: "removed", owner_id: null })
    .eq("id", instanceId);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, "remove_instance", "instance", instanceId, old, {
    status: "removed",
  });
  return { ok: true };
}

export async function adminToggleBan(userId: string, ban: boolean): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { data: old } = await admin
    .from("profiles")
    .select("is_banned")
    .eq("id", userId)
    .single();
  const { error } = await admin
    .from("profiles")
    .update({ is_banned: ban, banned_at: ban ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, ban ? "ban_user" : "unban_user", "user", userId, old, {
    is_banned: ban,
  });
  return { ok: true };
}

export async function adminSetRole(userId: string, role: "user" | "admin"): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  if (userId === adminId) return { ok: false, error: "Нельзя изменить собственную роль" };
  const { data: old } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!old) return { ok: false, error: "Пользователь не найден" };
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, "set_role", "user", userId, old, { role });
  return { ok: true };
}

export async function adminResolveRequest(
  txnId: number,
  approve: boolean
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { error } = await admin.rpc("resolve_balance_request", {
    p_txn_id: txnId,
    p_approve: approve,
    p_admin_id: adminId,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(
    admin,
    adminId,
    approve ? "approve_balance_request" : "reject_balance_request",
    "transaction",
    String(txnId),
    null,
    { approved: approve }
  );
  return { ok: true };
}

// ---------------- collections ----------------

export async function adminSaveCollection(
  data: Partial<Collection> & { id?: string }
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const id = data.id ?? undefined;
  const old =
    id && id !== "new"
      ? ((await admin.from("collections").select("*").eq("id", id).single())
          .data as Collection | null)
      : null;
  if (!old && !data.name) return { ok: false, error: "Название обязательно" };

  const row = {
    ...(id && id !== "new" ? { id } : {}),
    name: data.name,
    slug: data.slug ?? slugifyName(data.name ?? ""),
    description: data.description ?? null,
    image_url: data.image_url ?? null,
    total_minted: data.total_minted ?? 0,
    released_at: data.released_at ?? new Date().toISOString(),
    status: data.status ?? "active",
  };

  const { error } = id && id !== "new"
    ? await admin.from("collections").update(row).eq("id", id)
    : await admin.from("collections").insert(row);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, id && id !== "new" ? "update" : "create", "collection", id ?? null, old, row);
  return { ok: true };
}

// ---------------- chips ----------------

export async function adminSaveChip(
  data: Partial<Chip> & { id?: string }
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const id = data.id ?? undefined;
  const old =
    id && id !== "new"
      ? ((await admin.from("chips").select("*").eq("id", id).single()).data as Chip | null)
      : null;
  if (!old && !data.name) return { ok: false, error: "Название обязательно" };

  const row: Record<string, unknown> = {
    ...(id && id !== "new" ? { id } : {}),
    name: data.name,
    collection_id: data.collection_id,
    rarity_id: data.rarity_id,
    level_id: data.level_id,
    base_price: data.base_price,
    number: data.number,
    image_url: data.image_url ?? null,
    image_crop: data.image_crop ?? { x: 0.5, y: 0.5, zoom: 1 },
    total_minted: data.total_minted ?? 0,
    status: data.status ?? "active",
  };
  if (!row.collection_id || !row.rarity_id || !row.level_id) {
    return { ok: false, error: "Заполните коллекцию, редкость и уровень" };
  }
  if (typeof row.base_price !== "number" || row.base_price < 0) {
    return { ok: false, error: "Некорректная цена" };
  }

  const { error } = id && id !== "new"
    ? await admin.from("chips").update(row).eq("id", id)
    : await admin.from("chips").insert(row);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, id && id !== "new" ? "update" : "create", "chip", id ?? null, old, row);
  return { ok: true };
}

export async function adminDeleteChip(id: string): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { data: old } = await admin.from("chips").select("*").eq("id", id).single();
  const { error } = await admin.from("chips").update({ status: "disabled" }).eq("id", id);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, "disable_chip", "chip", id, old, { status: "disabled" });
  return { ok: true };
}

// ---------------- packs ----------------

export async function adminSavePack(
  data: Partial<Pack> & { id?: string }
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const id = data.id ?? undefined;
  const old =
    id && id !== "new"
      ? ((await admin.from("packs").select("*").eq("id", id).single()).data as Pack | null)
      : null;

  const row: Record<string, unknown> = {
    ...(id && id !== "new" ? { id } : {}),
    name: data.name,
    description: data.description ?? null,
    image_url: data.image_url ?? null,
    price: data.price,
    status: data.status ?? "draft",
    available_count: data.available_count ?? null,
    starts_at: data.starts_at || null,
    ends_at: data.ends_at || null,
  };
  if (!row.name) return { ok: false, error: "Название обязательно" };

  const { error } = id && id !== "new"
    ? await admin.from("packs").update(row).eq("id", id)
    : await admin.from("packs").insert(row);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, id && id !== "new" ? "update" : "create", "pack", id ?? null, old, row);
  return { ok: true };
}

export async function adminCreatePackVersion(
  packId: string,
  tiers: unknown[],
  items: unknown[]
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { error } = await admin.rpc("create_pack_version", {
    p_pack_id: packId,
    p_tiers: JSON.stringify(tiers),
    p_items: JSON.stringify(items),
    p_admin_id: adminId,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, "create_pack_version", "pack", packId, null, {
    version: "patch",
    tiers,
    items,
  });
  return { ok: true };
}

export async function adminDeletePack(id: string): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { data: old } = await admin.from("packs").select("*").eq("id", id).single();
  const { error } = await admin.from("packs").update({ status: "ended" }).eq("id", id);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, "end_pack", "pack", id, old, { status: "ended" });
  return { ok: true };
}

// ---------------- marketplace ----------------

export async function adminCancelListing(listingId: string): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { data: listing } = await admin
    .from("marketplace_listings")
    .select("id, instance_id, status")
    .eq("id", listingId)
    .single();
  if (!listing) return { ok: false, error: "Объявление не найдено" };
  if (listing.status !== "listed") return { ok: false, error: "Объявление уже неактивно" };

  const { error: e1 } = await admin
    .from("marketplace_listings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", listingId);
  const { error: e2 } = await admin
    .from("chip_instances")
    .update({ status: "owned" })
    .eq("id", listing.instance_id);
  if (e1 || e2) return { ok: false, error: e1?.message ?? e2?.message ?? "Ошибка" };
  await logAudit(admin, adminId, "cancel_listing", "listing", listingId, listing, { status: "cancelled" });
  return { ok: true };
}

// ---------------- promo ----------------

export async function adminSavePromo(
  data: Partial<PromoCode> & { id?: string }
): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const id = data.id ?? undefined;
  const old =
    id && id !== "new"
      ? ((await admin.from("promo_codes").select("*").eq("id", id).single()).data as PromoCode | null)
      : null;
  if (!data.code) return { ok: false, error: "Код обязателен" };

  const row = {
    ...(id && id !== "new" ? { id } : {}),
    code: data.code.toUpperCase(),
    bonus_type: data.bonus_type ?? "fixed",
    bonus_value: data.bonus_value,
    max_uses: data.max_uses ?? 0,
    per_user_limit: data.per_user_limit ?? 1,
    starts_at: data.starts_at || null,
    ends_at: data.ends_at || null,
    is_active: data.is_active ?? true,
  };

  const { error } = id && id !== "new"
    ? await admin.from("promo_codes").update(row).eq("id", id)
    : await admin.from("promo_codes").insert(row);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, id && id !== "new" ? "update" : "create", "promo", id ?? null, old, row);
  return { ok: true };
}

export async function adminDeletePromo(id: string): Promise<Result> {
  const { admin, adminId } = await getAdmin();
  const { data: old } = await admin.from("promo_codes").select("*").eq("id", id).single();
  const { error } = await admin.from("promo_codes").delete().eq("id", id);
  if (error) return { ok: false, error: translateDbError(error.message) };
  await logAudit(admin, adminId, "delete", "promo", id, old, null);
  return { ok: true };
}

// ---------------- image upload ----------------

export async function adminUploadImage(
  bucket: "chips" | "collections" | "packs",
  folder: string,
  file: File
): Promise<Result<{ url: string }>> {
  const { admin } = await getAdmin();
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
  const path = `${cleanFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return { ok: true, data: { url: data.publicUrl } };
}

// ---------------- audit listing ----------------

export async function adminListAudit(): Promise<{
  logs: AdminAuditLog[];
  admins: Record<string, string>;
}> {
  const { admin } = await getAdmin();
  const { data: logs } = await admin
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: admins } = await admin
    .from("profiles")
    .select("id, username");
  const map: Record<string, string> = {};
  (admins ?? []).forEach((a) => (map[a.id] = a.username));
  return { logs: (logs ?? []) as AdminAuditLog[], admins: map };
}