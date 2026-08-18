import { redirect } from "next/navigation";
import { createSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Админ-панель отключена</h1>
        <p className="mt-2 text-sm text-ink-faint">
          Добавьте <code className="text-brand">SUPABASE_SERVICE_ROLE_KEY</code> в{" "}
          <code className="text-brand">.env.local</code> (Settings → API → Secret key / Service Role)
          и перезапустите сервер.
        </p>
      </div>
    );
  }

  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") redirect("/shop");

  return <>{children}</>;
}