import { AdminShell } from "@/components/admin/admin-nav";
import { PendingRequests, StatusBadge, StatCard } from "@/components/admin/admin-widgets";
import { Panel, PanelHeader } from "@/components/ui/misc";
import { getDashboardStats } from "@/lib/data/admin";
import { fmtDate, fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <AdminShell title="Дашборд">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Пользователей" value={fmtNumber(stats.users)} />
        <StatCard label="Оборот" value={`${fmtNumber(stats.turnover)} ₽`} hint="сумма покупок" />
        <StatCard label="Активных листингов" value={fmtNumber(stats.listings)} />
        <StatCard label="Ожидают заявок" value={fmtNumber(stats.pendingRequests)} hint="пополнение/вывод" />
        <StatCard label="Открыто паков" value={fmtNumber(stats.packsOpened)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Ожидающие заявки"
            right={
              stats.pendingRequests > 0 ? (
                <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-semibold text-warn">
                  {stats.pendingRequests}
                </span>
              ) : null
            }
          />
          <PendingRequests requests={stats.recentRequests as never} />
        </Panel>

        <Panel>
          <PanelHeader title="Последние операции" />
          <div className="divide-y divide-panel-border">
            {stats.recentTxns.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-ink-faint">Операций пока нет</p>
            ) : (
              stats.recentTxns.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <StatusBadge status={t.status} />
                  <div className="min-w-0 flex-1 truncate text-[13px] text-ink">
                    {t.user?.username ?? "—"}
                    <span className="ml-2 text-[11px] text-ink-faint">{t.type}</span>
                  </div>
                  <span className="tabular text-[13px] text-ink-faint">
                    {t.amount > 0 ? "+" : "−"}{fmtNumber(Math.round(Math.abs(t.amount)))} ₽
                  </span>
                  <span className="hidden text-[11px] text-ink-dim sm:block">
                    {fmtDate(t.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}