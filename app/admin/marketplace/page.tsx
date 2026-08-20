import { AdminShell } from "@/components/admin/admin-nav";
import { Panel, PanelHeader } from "@/components/ui/misc";
import { CancelListingButton } from "@/components/admin/cancel-listing-button";
import { listActiveListings, listRecentSales } from "@/lib/data/admin";
import { fmtDate, fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMarketplacePage() {
  const [listings, sales] = await Promise.all([
    listActiveListings(),
    listRecentSales(),
  ]);

  return (
    <AdminShell title="Площадка">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Active listings */}
        <Panel>
          <PanelHeader title="Активные объявления" />
          {listings.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-ink-faint">Активных объявлений нет</p>
          ) : (
            <div className="divide-y divide-[rgb(var(--border))]">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-3.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {l.instance?.chip.name ?? "—"}
                      <span className="ml-1.5 tabular text-[10px] text-ink-faint">
                        №{l.instance?.serial}
                      </span>
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      {l.instance?.owner?.username ?? "—"} · {fmtDate(l.created_at)}
                    </p>
                  </div>
                  <span className="tabular text-[12px] font-bold text-ink shrink-0">
                    {fmtNumber(Math.round(l.price))} ₽
                  </span>
                  <CancelListingButton listingId={l.id} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Recent sales */}
        <Panel>
          <PanelHeader title="Последние продажи" />
          {sales.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-ink-faint">Продаж пока нет</p>
          ) : (
            <div className="divide-y divide-[rgb(var(--border))]">
              {sales.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-3.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">
                      {s.chip?.name ?? "—"}
                      <span className="ml-1.5 tabular text-[10px] text-ink-faint">№{s.instance?.serial}</span>
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      продал: {s.buyer?.username ?? "—"} · {fmtDate(s.created_at)}
                    </p>
                  </div>
                  <span className="tabular text-[12px] font-bold text-ok shrink-0">
                    +{fmtNumber(Math.round(s.price))} ₽
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}