"use server";

import { redirect } from "next/navigation";
import { createSupabase } from "@/lib/supabase/server";
import { translateDbError, type Result } from "@/lib/actions/errors";

export async function signIn(
  email: string,
  password: string
): Promise<Result> {
  const sb = await createSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true };
}

export async function signUp(
  email: string,
  password: string,
  username: string
): Promise<Result> {
  const sb = await createSupabase();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const sb = await createSupabase();
  await sb.auth.signOut();
}

/**
 * Google OAuth: включите провайдера в Supabase Dashboard (Authentication →
 * Providers → Google) и установите NEXT_PUBLIC_GOOGLE_OAUTH=true в .env.local.
 * Пока флаг не установлен, кнопка входа не показывается.
 */
export async function signInWithGoogle(): Promise<Result<{ url: string }>> {
  if (process.env.NEXT_PUBLIC_GOOGLE_OAUTH !== "true") {
    return { ok: false, error: "Google OAuth не включён" };
  }
  const sb = await createSupabase();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/auth/callback` },
  });
  if (error) return { ok: false, error: translateDbError(error.message) };
  return { ok: true, data: { url: data.url } };
}

export async function requireUser() {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return { sb, user };
}