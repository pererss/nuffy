import { NextResponse } from "next/server";
import { createSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login", url.origin));

  const sb = await createSupabase();
  await sb.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/shop", url.origin));
}