import { AdminShell } from "@/components/admin/admin-nav";
import { PromosPanel } from "@/components/admin/promos-panel";
import { listPromos } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminPromosPage() {
  const promos = await listPromos();
  return (
    <AdminShell title="Промокоды">
      <PromosPanel promos={promos} />
    </AdminShell>
  );
}
