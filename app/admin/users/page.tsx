import { AdminShell } from "@/components/admin/admin-nav";
import { UsersPanel } from "@/components/admin/users-panel";
import { listUsers, listAllChipsAdmin } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const [res, chips] = await Promise.all([
    listUsers(q, Number(page ?? 1)),
    listAllChipsAdmin(),
  ]);

  return (
    <AdminShell title="Пользователи">
      <UsersPanel
        initialUsers={res.users}
        total={res.total}
        pages={res.pages}
        chips={chips as Array<{ id: string; name: string; rarity: { name: string } | null }>}
      />
    </AdminShell>
  );
}