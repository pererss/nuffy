import { AdminShell } from "@/components/admin/admin-nav";
import { CollectionsPanel } from "@/components/admin/collections-panel";
import { getCatalog } from "@/lib/data/chips";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const admin = createAdminClient();
  const [catalog, { data: collections }, { data: chips }] = await Promise.all([
    getCatalog(),
    admin.from("collections").select("*").order("released_at", { ascending: false }),
    admin.from("chips").select("collection_id"),
  ]);

  const chipsCount: Record<string, number> = {};
  (chips ?? []).forEach((c) => {
    chipsCount[c.collection_id as string] = (chipsCount[c.collection_id as string] ?? 0) + 1;
  });

  return (
    <AdminShell title="Коллекции">
      <CollectionsPanel collections={catalog.collections} chipsCount={chipsCount} />
    </AdminShell>
  );
}