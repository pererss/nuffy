import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-nav";
import { PackVersionsEditor } from "@/components/admin/pack-versions-editor";
import { getPackWithVersions, listAllChipsAdmin } from "@/lib/data/admin";
import { getCatalog } from "@/lib/data/chips";

export const dynamic = "force-dynamic";

export default async function AdminPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [res, chips, catalog] = await Promise.all([
    getPackWithVersions(id),
    listAllChipsAdmin(),
    getCatalog(),
  ]);
  if (!res.pack) notFound();

  return (
    <AdminShell title={`Пак: ${String(res.pack.name)}`}>
      <PackVersionsEditor
        packId={id}
        packName={String(res.pack.name)}
        versions={res.versions}
        chips={chips as Array<{ id: string; name: string; rarity: { slug: string; name: string } | null }>}
        rarities={catalog.rarities}
      />
    </AdminShell>
  );
}