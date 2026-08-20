import { AdminShell } from "@/components/admin/admin-nav";
import { ChipsPanel } from "@/components/admin/chips-panel";
import { getCatalog } from "@/lib/data/chips";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminChipsPage() {
  const admin = createAdminClient();
  const [catalog, { data }] = await Promise.all([
    getCatalog(),
    admin
      .from("chips")
      .select("*, collection:collections(name, status), rarity:rarities(id, slug, name, color, sort_order), level:levels(id, name, slug, sort_order, color)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AdminShell title="Фишки">
      <ChipsPanel
        chips={data as never}
        collections={catalog.collections}
        rarities={catalog.rarities}
        levels={catalog.levels}
      />
    </AdminShell>
  );
}