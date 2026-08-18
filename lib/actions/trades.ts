"use server";

import { createSupabase } from "@/lib/supabase/server";
import { translateDbError, type Result } from "@/lib/actions/errors";
import type { ChipWithMeta, Trade } from "@/lib/types";

export async function createTrade(
  instanceIds: string[],
  wantChipIds: string[],
  code?: string
): Promise<Result<{ tradeId: string; code: string }>> {
  const sb = await createSupabase();
  const { data, error } = await sb.rpc("create_trade", {
    p_instance_ids: instanceIds,
    p_want_chip_ids: wantChipIds,
    p_code: code ?? "",
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  const tradeCode = code?.trim().toUpperCase() ?? "";
  if (tradeCode) {
    const { data: t } = await sb
      .from("trades")
      .select("code")
      .eq("id", data as string)
      .single();
    return { ok: true, data: { tradeId: data as string, code: (t?.code ?? tradeCode) as string } };
  }
  return { ok: true, data: { tradeId: data as string, code: "" } };
}

export async function acceptTrade(
  code: string,
  instanceIds: string[]
): Promise<Result<{ tradeId: string }>> {
  const sb = await createSupabase();
  const { data, error } = await sb.rpc("accept_trade", {
    p_code: code,
    p_instance_ids: instanceIds,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: { tradeId: data as string } };
}

export async function cancelTrade(tradeId: string): Promise<Result> {
  const sb = await createSupabase();
  const { error } = await sb.rpc("cancel_trade", { p_trade_id: tradeId });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true };
}

export async function getTradeByCode(
  code: string
): Promise<
  Result<{
    trade: Trade;
    items: Array<{
      instance_id: string;
      serial: number;
      chip: ChipWithMeta;
    }>;
    wants: ChipWithMeta[];
    initiatorName: string;
  }>
> {
  const sb = await createSupabase();
  const clean = code.trim().toUpperCase();
  if (clean.length < 3) return { ok: false, error: "Код слишком короткий" };

  const { data: trade, error } = await sb
    .from("trades")
    .select("*")
    .eq("code", clean)
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: translateDbError(error.message) };
  if (!trade) return { ok: false, error: "Обмен не найден" };
  if (trade.status !== "pending") {
    return { ok: false, error: "Этот обмен уже завершён или отменён" };
  }

  const [{ data: items }, { data: wants }, { data: initiator }] =
    await Promise.all([
      sb
        .from("trade_items")
        .select(
          "instance_id, giver_id, instance:chip_instances(serial, chip_id, chip:chips(id, name, number, image_url, image_crop, base_price, collection_id, rarity_id, level_id, total_minted, sold_count, status, created_at, collection:collections(id, name, slug, status), rarity:rarities(id, slug, name, color, sort_order), level:levels(id, name, slug, sort_order, color)))"
        )
        .eq("trade_id", trade.id),
      sb.from("chips").select(
        "*, collection:collections(id, name, slug, status), rarity:rarities(id, slug, name, color, sort_order), level:levels(id, name, slug, sort_order, color)"
      ).in("id", trade.wants ?? []),
      sb
        .from("profiles_public")
        .select("username")
        .eq("user_id", trade.initiator_id)
        .single(),
    ]);

  const mappedItems: Array<{
    instance_id: string;
    serial: number;
    chip: ChipWithMeta;
  }> = (items ?? []).flatMap((row: any) =>
    row.instance?.chip
      ? [{ instance_id: row.instance_id, serial: row.instance.serial, chip: row.instance.chip as ChipWithMeta }]
      : []
  );

  return {
    ok: true,
    data: {
      trade: trade as Trade,
      items: mappedItems,
      wants: (wants ?? []) as ChipWithMeta[],
      initiatorName: (initiator?.username as string | undefined) ?? "Пользователь",
    },
  };
}