import { AdminShell } from "@/components/admin/admin-nav";
import { CancelListingButton } from "@/components/admin/cancel-listing-button";
import { Panel, PanelHeader } from "@/components/ui/misc";
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
      <Panel className="mb-6">
        <PanelHeader title="Активные объявления" />
        <div className="divide-y divide-panel-border">
          {listings.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-ink-faint">Активных объявлений нет</p>
          ) : (
            listings.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {l.instance?.chip.name ?? "—"}
                    <span className="ml-2 tabular text-[11px] text-ink-faint">
                      №{l.instance?.serial}
                    </span>
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {l.instance?.owner?.username ?? "—"} · {fmtDate(l.created_at)}
                  </p>
                </div>
                <span className="tabular text-[13px] font-bold text-ink">
                  {fmtNumber(Math.round(l.price))} ₽
                </span>
                <CancelListingButton listingId={l.id} />
              </div>
            ))
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Последние продажи" />
        <div className="divide-y divide-panel-border">
          {sales.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-ink-faint">Продаж пока нет</p>
          ) : (
            sales.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">
                    {s.chip?.name ?? "—"}
                    <span className="ml-2 tabular text-[11px] text-ink-faint">№{s.instance?.serial}</span>
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    продал: {s.buyer?.username ?? "—"} · {fmtDate(s.created_at)}
                  </p>
                </div>
                <span className="tabular text-[13px] font-bold text-ok">
                  +{fmtNumber(Math.round(s.price))} ₽
                </span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </AdminShell>
  );
}
