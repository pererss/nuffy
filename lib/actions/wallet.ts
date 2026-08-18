"use server";

import { createSupabase } from "@/lib/supabase/server";
import { translateDbError, type Result } from "@/lib/actions/errors";

export async function requestBalanceChange(
  type: "deposit" | "withdraw",
  amount: number
): Promise<Result<{ txnId: number }>> {
  const sb = await createSupabase();
  const { data, error } = await sb.rpc("request_balance_change", {
    p_type: type,
    p_amount: amount,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: { txnId: data as number } };
}

export async function activatePromo(code: string): Promise<Result<{ amount: number }>> {
  const sb = await createSupabase();
  const { data, error } = await sb.rpc("activate_promo", { p_code: code });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: { amount: Number(data) } };
}