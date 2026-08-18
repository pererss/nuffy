"use server";

import { createSupabase } from "@/lib/supabase/server";
import { translateDbError, type Result } from "@/lib/actions/errors";
import type { UpgradeResult } from "@/lib/types";

export async function upgradeChip(
  sourceInstanceId: string,
  targetChipId: string,
  balanceSpent: number
): Promise<Result<UpgradeResult>> {
  const sb = await createSupabase();
  const { data, error } = await sb.rpc("upgrade_chip", {
    p_source_instance_id: sourceInstanceId,
    p_target_chip_id: targetChipId,
    p_balance_spent: balanceSpent,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: data as UpgradeResult };
}