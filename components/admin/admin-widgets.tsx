"use client";

import { Panel, PanelHeader, StatCard } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { fmtDate, fmtNumber } from "@/lib/utils";

function PendingRequests({ requests }: { requests: Array<{ id: number | string; type: string; amount: number; status: string; created_at: string; user?: { username: string } }> }) {
  if (requests.length === 0) return <p className="px-4 py-3 text-[13px] text-ink-faint">Заявок пока нет</p>;
  return (
    <div className="divide-y divide-[rgb(var(--border))]">
      {requests.map((r) => (
        <div key={String(r.id)} className="flex items-center gap-3 px-4 py-2">
          <StatusBadge status={r.status} />
          <div className="min-w-0 flex-1 truncate text-[13px] text-ink">
            {r.user?.username ?? "—"}
            <span className="ml-2 text-[10px] text-ink-faint">{r.type}</span>
          </div>
          <span className="tabular text-[12px] text-ink-faint shrink-0">
            {r.amount > 0 ? "+" : "−"}{fmtNumber(Math.round(Math.abs(r.amount)))} ₽
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "completed" ? "emerald" : status === "rejected" ? "red" : "amber";
  return <Badge color={color} tone="dot">{status}</Badge>;
}

export function AdminWidgets({
  stats,
}: {
  stats: {
    users: number;
    turnover: number;
    listings: number;
    pendingRequests: number;
    packsOpened: number;
    recentRequests: Array<{ id: number | string; type: string; amount: number; status: string; created_at: string; user?: { username: string } | null }>;
    recentTxns: Array<{ id: number | string; type: string; amount: number; status: string; created_at: string; user?: { username: string } | null }>;
  };
}) {
  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Пользователей" value={fmtNumber(stats.users)} />
        <StatCard label="Оборот" value={`${fmtNumber(stats.turnover)} ₽`} sub="покупки" />
        <StatCard label="Листингов" value={fmtNumber(stats.listings)} />
        <StatCard label="Заявки" value={fmtNumber(stats.pendingRequests)} sub="ожидание" />
        <StatCard label="Открыто паков" value={fmtNumber(stats.packsOpened)} />
      </div>

      {/* Two columns */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Pending requests */}
        <Panel>
          <PanelHeader
            title="Заявки"
            right={
              stats.pendingRequests > 0 ? (
                <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-bold text-warn">
                  {stats.pendingRequests}
                </span>
              ) : null
            }
          />
          <PendingRequests requests={stats.recentRequests as never} />
        </Panel>

        {/* Recent transactions */}
        <Panel>
          <PanelHeader title="Последние операции" />
          <div className="divide-y divide-[rgb(var(--border))]">
            {stats.recentTxns.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-ink-faint">Операций пока нет</p>
            ) : (
              stats.recentTxns.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2">
                  <StatusBadge status={t.status} />
                  <div className="min-w-0 flex-1 truncate text-[13px] text-ink">
                    {t.user?.username ?? "—"}
                    <span className="ml-2 text-[10px] text-ink-faint">{t.type}</span>
                  </div>
                  <span className="tabular text-[12px] text-ink-faint shrink-0">
                    {t.amount > 0 ? "+" : "−"}{fmtNumber(Math.round(Math.abs(t.amount)))} ₽
                  </span>
                  <span className="hidden text-[10px] text-ink-dim sm:block">
                    {fmtDate(t.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

export { PendingRequests, StatusBadge };