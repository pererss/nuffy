import { AdminShell } from "@/components/admin/admin-nav";
import { AdminWidgets } from "@/components/admin/admin-widgets";
import { getDashboardStats } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <AdminShell title="Дашборд">
      <AdminWidgets stats={stats} />
    </AdminShell>
  );
}