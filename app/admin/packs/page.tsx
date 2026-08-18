import { AdminShell } from "@/components/admin/admin-nav";
import { PacksPanel } from "@/components/admin/packs-panel";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Pack } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPacksPage() {
  const admin = createAdminClient();
  const [{ data: packs }, { data: versions }] = await Promise.all([
    admin.from("packs").select("*").order("created_at", { ascending: false }),
    admin.from("pack_versions").select("pack_id"),
  ]);

  const versionsCount: Record<string, number> = {};
  (versions ?? []).forEach((v) => {
    versionsCount[v.pack_id as string] = (versionsCount[v.pack_id as string] ?? 0) + 1;
  });

  return (
    <AdminShell title="Паки">
      <PacksPanel packs={(packs ?? []) as Pack[]} versionsCount={versionsCount} />
    </AdminShell>
  );
}