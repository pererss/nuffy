import { AdminShell } from "@/components/admin/admin-nav";
import { Panel, PanelHeader } from "@/components/ui/misc";
import { PendingRequests, StatusBadge } from "@/components/admin/admin-widgets";
import { listPendingRequests, listTransactions } from "@/lib/data/admin";
import { fmtDate, fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const [pending, txns] = await Promise.all([
    listPendingRequests(),
    listTransactions(100),
  ]);

  return (
    <AdminShell title="Транзакции">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Pending requests */}
        <Panel>
          <PanelHeader title="Заявки" />
          <PendingRequests requests={pending as never} />
        </Panel>

        {/* Transaction history */}
        <Panel>
          <PanelHeader title="История операций" />
          {txns.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-ink-faint">Операций пока нет</p>
          ) : (
            <div className="divide-y divide-[rgb(var(--border))]">
              {txns.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3.5 py-2">
                  <StatusBadge status={t.status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">
                      {t.user?.username ?? "—"}
                      <span className="ml-1.5 text-[10px] uppercase text-ink-faint">{t.type}</span>
                    </p>
                    {t.description && (
                      <p className="truncate text-[10px] text-ink-dim">{t.description}</p>
                    )}
                  </div>
                  <span className="hidden text-[10px] text-ink-faint sm:block">{fmtDate(t.created_at)}</span>
                  <span className={t.amount >= 0 ? "tabular text-[12px] font-bold text-ok" : "tabular text-[12px] font-bold text-danger"}>
                    {t.amount >= 0 ? "+" : "−"}{fmtNumber(Math.round(Math.abs(t.amount)))} ₽
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