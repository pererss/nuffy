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

export async function requireUser() {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return { sb, user };
}