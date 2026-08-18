import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/misc";
import { UpgradesView } from "@/components/upgrades/upgrades-view";
import { getInventory, getAllChips, getMyUpgrades } from "@/lib/data/chips";
import { createSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpgradesPage() {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [items, allChips, history] = await Promise.all([
    getInventory(user.id),
    getAllChips(),
    getMyUpgrades(user.id, 30),
  ]);

  const owned = items.filter((i) => i.status === "owned");

  return (
    <>
      <PageHeader
        title="Апгрейды"
        description="Сожгите фишку (и необязательно баланс), чтобы получить более ценную"
      />
      <UpgradesView owned={owned} allChips={allChips} history={history} />
    </>
  );
}
