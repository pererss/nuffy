"use server";

import { createSupabase } from "@/lib/supabase/server";
import { translateDbError, type Result } from "@/lib/actions/errors";

export type ChipActionResult = {
  instanceId: string;
  name: string;
  rarity: string;
};

async function enrich(sb: Awaited<ReturnType<typeof createSupabase>>, instanceId: string) {
  const { data } = await sb
    .from("chip_instances")
    .select("id, chip:chips(name, rarity:rarities(slug))")
    .eq("id", instanceId)
    .single();
  return {
    instanceId,
    name: (data?.chip as { name?: string } | undefined)?.name ?? "Фишка",
    rarity:
      (data?.chip as { rarity?: { slug?: string } } | undefined)?.rarity?.slug ??
      "common",
  };
}

export async function buyChip(chipId: string): Promise<Result<ChipActionResult>> {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Войдите, чтобы продолжить" };
  const { data, error } = await sb.rpc("buy_chip", { p_chip_id: chipId });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: await enrich(sb, data as string) };
}

export async function openPack(packId: string): Promise<Result<ChipActionResult>> {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Войдите, чтобы продолжить" };
  const { data, error } = await sb.rpc("open_pack", { p_pack_id: packId });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: await enrich(sb, data as string) };
}

export async function toggleFavorite(chipId: string): Promise<Result<{ liked: boolean }>> {
  const sb = await createSupabase();
  const { data, error } = await sb.rpc("toggle_favorite", { p_chip_id: chipId });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: { liked: Boolean(data) } };
}