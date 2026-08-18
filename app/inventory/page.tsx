import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/misc";
import { InventoryView } from "@/components/inventory/inventory-view";
import { getInventory, getCatalog, getAllChips } from "@/lib/data/chips";
import { createSupabase } from "@/lib/supabase/server";
import { fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [items, catalog, allChips] = await Promise.all([
    getInventory(user.id),
    getCatalog(),
    getAllChips(),
  ]);

  const owned = items.filter((i) => i.status === "owned" || i.status === "listed");
  const value = owned.reduce((s, i) => s + i.base_price, 0);

  return (
    <>
      <PageHeader
        title="Инвентарь"
        description={`${fmtNumber(owned.length)} фишек · оценочная стоимость ${fmtNumber(Math.round(value))} ₽`}
      />
      <InventoryView
        items={items}
        rarities={catalog.rarities}
        levels={catalog.levels}
        collections={catalog.collections}
        allChips={allChips}
      />
    </>
  );
}
