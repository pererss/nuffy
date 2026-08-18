import { NextResponse } from "next/server";
import { createSupabase } from "@/lib/supabase/server";
import { translateDbError } from "@/lib/actions/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  if (username.length < 3 || username.length > 20) {
    return NextResponse.json({ error: "Имя должно быть от 3 до 20 символов" }, { status: 400 });
  }

  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { error } = await sb
    .from("profiles")
    .update({ username })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json(
      { error: translateDbError(error.message) },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}