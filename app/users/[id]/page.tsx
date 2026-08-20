import { notFound } from "next/navigation";
import { ChipCard } from "@/components/chips/chip-card";
import { Badge } from "@/components/ui/badge";
import { Panel, EmptyState, PageHeader } from "@/components/ui/misc";
import { getPublicProfile, getUserStats, getListings } from "@/lib/data/chips";
import { fmtDate, fmtNumber } from "@/lib/utils";
import type { ChipWithMeta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, stats, listings] = await Promise.all([
    getPublicProfile(id),
    getUserStats(id),
    getListings({ seller: id, pageSize: 12 }),
  ]);
  if (!profile) notFound();

  const cards = listings.listings.map((l) => ({
    ...(l.instance.chip as ChipWithMeta),
    listing_id: l.id,
    listing_price: l.price,
    serial: l.instance.serial,
  }));

  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="page-enter">
      <PageHeader
        title={profile.username}
        description={joined ? `Участник с ${joined}` : ""}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <Panel className="p-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] bg-brand/15 font-display text-lg font-bold text-brand">
              {profile.username.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-[15px] font-bold tracking-tight text-ink">{profile.username}</h1>
              <p className="text-[11px] text-ink-faint">{fmtDate(profile.created_at ?? new Date().toISOString())}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2">
              <p className="text-[10px] text-ink-faint">Фишек</p>
              <p className="mt-0.5 text-[15px] font-semibold tabular text-ink">
                {fmtNumber(stats?.itemsCount ?? 0)}
              </p>
            </div>
            <div className="rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2">
              <p className="text-[10px] text-ink-faint">Листингов</p>
              <p className="mt-0.5 text-[15px] font-semibold tabular text-ink">
                {fmtNumber(stats?.listingsCount ?? 0)}
              </p>
            </div>
            <div className="col-span-2 rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2">
              <p className="text-[10px] text-ink-faint">Лучший предмет</p>
              {stats?.bestChip ? (
                <p className="mt-0.5 text-[14px] font-semibold tabular text-ink">
                  {stats.bestChip.name}
                  <span className="ml-2 text-ink-faint">
                    {fmtNumber(Math.round(stats.bestChip.base_price))} ₽
                  </span>
                </p>
              ) : (
                <p className="mt-0.5 text-[12px] text-ink-faint">—</p>
              )}
            </div>
          </div>
        </Panel>

        {/* Listings */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-[13px] font-bold tracking-[0.08em] text-ink">Активные лоты</h2>
            <Badge variant="neutral">{cards.length}</Badge>
          </div>
          {cards.length === 0 ? (
            <Panel className="p-6">
              <EmptyState
                title="Активных лотов нет"
                description="Пользователь пока ничего не выставил"
              />
            </Panel>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {cards.map((c) => (
                <ChipCard
                  key={c.listing_id}
                  chip={c}
                  href={`/marketplace/${c.listing_id}`}
                  price={<span className="tabular text-[12px] font-bold text-ink">{fmtNumber(Math.round(c.listing_price))} ₽</span>}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}