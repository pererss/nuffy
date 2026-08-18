import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/misc";
import { TradesView } from "@/components/trades/trades-view";
import { getTradesForUser, getTrade, getInventory, getUsernames } from "@/lib/data/chips";
import { createSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [trades, owned] = await Promise.all([
    getTradesForUser(user.id),
    getInventory(user.id),
  ]);

  const entries = (
    await Promise.all(trades.map((t) => getTrade(t.id)))
  ).filter(Boolean) as Array<NonNullable<Awaited<ReturnType<typeof getTrade>>>>;

  const partnerIds = Array.from(
    new Set(
      entries
        .map((t) => t.trade.partner_id)
        .filter(Boolean) as string[]
    )
  );
  const usernamesMap = await getUsernames(partnerIds);
  const usernames: Record<string, string> = {};
  usernamesMap.forEach((v, k) => (usernames[k] = v.username));

  return (
    <>
      <PageHeader
        title="Обмены"
        description="Меняйтесь фишками с друзьями по коду"
      />
      <TradesView trades={entries} owned={owned} usernames={usernames} myId={user.id} />
    </>
  );
}