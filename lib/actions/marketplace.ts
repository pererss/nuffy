"use server";

import { createSupabase } from "@/lib/supabase/server";
import { translateDbError, type Result } from "@/lib/actions/errors";

export async function createListing(
  instanceId: string,
  price: number
): Promise<Result<{ listingId: string }>> {
  const sb = await createSupabase();
  const { data, error } = await sb.rpc("create_listing", {
    p_instance_id: instanceId,
    p_price: price,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: { listingId: data as string } };
}

export async function cancelListing(listingId: string): Promise<Result> {
  const sb = await createSupabase();
  const { error } = await sb.rpc("cancel_listing", {
    p_listing_id: listingId,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true };
}

export async function buyListing(
  listingId: string
): Promise<Result<{ instanceId: string }>> {
  const sb = await createSupabase();
  const { data, error } = await sb.rpc("buy_listing", {
    p_listing_id: listingId,
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: { instanceId: data as string } };
}