import { AdminShell } from "@/components/admin/admin-nav";
import { BlocksPanel } from "@/components/admin/blocks-panel";
import { listUsers } from "@/lib/data/admin";
import type { AdminUser } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminBlocksPage() {
  const res = await listUsers(undefined, 1, 200);
  const banned = res.users.filter((u) => u.is_banned);

  return (
    <AdminShell title="Блокировки">
      <BlocksPanel users={banned} />
    </AdminShell>
  );
}