import { AdminShell } from "@/components/admin/admin-nav";
import { listAuditLogs } from "@/lib/data/admin";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const { logs } = await listAuditLogs(200);

  return (
    <AdminShell title="Журнал действий администраторов">
      <div className="overflow-x-auto rounded-card border border-panel-border">
        <table className="w-full min-w-[900px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-panel-border bg-panel-hover/50 text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-3 py-2.5 font-semibold">Когда</th>
              <th className="px-3 py-2.5 font-semibold">Админ</th>
              <th className="px-3 py-2.5 font-semibold">Действие</th>
              <th className="px-3 py-2.5 font-semibold">Сущность</th>
              <th className="px-3 py-2.5 font-semibold">ID</th>
              <th className="px-3 py-2.5 font-semibold">Изменения</th>
              <th className="px-3 py-2.5 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-ink-faint">
                  Записей нет
                </td>
              </tr>
            ) : (
              logs.map((l) => {
                const rec = l as Record<string, unknown>;
                const admin = rec.admin as { username?: string } | null;
                return (
                  <tr key={String(rec.id)} className="align-top hover:bg-panel-hover/40">
                    <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-ink-faint">
                      {fmtDate(String(rec.created_at))}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-ink">
                      {admin?.username ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[12px] text-brand">
                        {String(rec.action)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{String(rec.entity)}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-faint">
                      {String(rec.entity_id ?? "—").slice(0, 18)}
                    </td>
                    <td className="px-3 py-2.5">
                      {(rec.new_values as Record<string, unknown> | null) ? (
                        <pre className="max-w-[300px] truncate font-mono text-[11px] text-ink-soft">
                          {JSON.stringify(rec.new_values)}
                        </pre>
                      ) : (
                        <span className="text-ink-dim">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-faint">
                      {String(rec.ip ?? "—")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}