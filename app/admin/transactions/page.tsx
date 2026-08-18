import { AdminShell } from "@/components/admin/admin-nav";
import { PendingRequests, StatusBadge } from "@/components/admin/admin-widgets";
import { Panel, PanelHeader } from "@/components/ui/misc";
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
      <Panel className="mb-6">
        <PanelHeader title="Заявки на пополнение / вывод" />
        <PendingRequests
          requests={pending as never}
        />
      </Panel>

      <Panel>
        <PanelHeader title="История операций" />
        <div className="divide-y divide-panel-border">
          {txns.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-ink-faint">Операций пока нет</p>
          ) : (
            txns.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <StatusBadge status={t.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">
                    {t.user?.username ?? "—"}
                    <span className="ml-2 text-[11px] uppercase text-ink-faint">{t.type}</span>
                  </p>
                  {t.description && (
                    <p className="truncate text-[11px] text-ink-dim">{t.description}</p>
                  )}
                </div>
                <span className="hidden text-[11px] text-ink-faint sm:block">
                  {fmtDate(t.created_at)}
                </span>
                <span
                  className={
                    t.amount >= 0
                      ? "tabular text-[13px] font-bold text-ok"
                      : "tabular text-[13px] font-bold text-danger"
                  }
                >
                  {t.amount >= 0 ? "+" : "−"}{fmtNumber(Math.round(Math.abs(t.amount)))} ₽
                </span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </AdminShell>
  );
}
