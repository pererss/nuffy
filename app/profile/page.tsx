import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/misc";
import { ProfileView, type ProfileData } from "@/components/profile/profile-view";
import { getUserStats, getBestDrop } from "@/lib/data/chips";
import { createSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [profile, stats, bestDrop] = await Promise.all([
    sb
      .from("profiles")
      .select("id, username, account_id, balance, created_at")
      .eq("id", user.id)
      .single(),
    getUserStats(user.id),
    getBestDrop(user.id),
  ]);
  if (!profile.data) redirect("/login");

  const data: ProfileData = {
    username: profile.data.username,
    accountId: String(profile.data.account_id ?? ""),
    balance: profile.data.balance ?? 0,
    createdAt: profile.data.created_at ?? user.created_at ?? new Date().toISOString(),
    itemsCount: stats?.itemsCount ?? 0,
    listingsCount: stats?.listingsCount ?? 0,
    bestChip: stats?.bestChip ?? null,
    bestDrop: (bestDrop ?? null) as ProfileData["bestDrop"],
  };

  return (
    <>
      <PageHeader title="Профиль" description="Личные данные и статистика" />
      <ProfileView data={data} />
    </>
  );
}