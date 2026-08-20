import { AdminShell } from "@/components/admin/admin-nav";
import { Panel, PanelHeader } from "@/components/ui/misc";
import { listAuditLogs } from "@/lib/data/admin";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const { logs } = await listAuditLogs(200);

  return (
    <AdminShell title="Журнал действий">
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Когда</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Админ</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Действие</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Сущность</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">ID</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Изменения</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {logs.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-ink-faint">Записей нет</td></tr>
              ) : (
                logs.map((l) => {
                  const rec = l as Record<string, unknown>;
                  const admin = rec.admin as { username?: string } | null;
                  return (
                    <tr key={String(rec.id)} className="align-top hover:bg-[rgb(var(--surface-hover))]/50">
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] text-ink-faint">{fmtDate(String(rec.created_at))}</td>
                      <td className="px-3 py-2 font-medium text-ink">{admin?.username ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-brand">{String(rec.action)}</td>
                      <td className="px-3 py-2 text-ink-soft">{String(rec.entity)}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-ink-faint">{String(rec.entity_id ?? "—").slice(0, 18)}</td>
                      <td className="px-3 py-2">
                        {(rec.new_values as Record<string, unknown> | null) ? (
                          <pre className="max-w-[280px] truncate font-mono text-[10px] text-ink-soft">{JSON.stringify(rec.new_values)}</pre>
                        ) : (
                          <span className="text-ink-dim">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-ink-faint">{String(rec.ip ?? "—")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}