"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { adminToggleBan } from "@/lib/actions/admin";
import { fmtAccountId, fmtDate, fmtNumber } from "@/lib/utils";
import type { AdminUser } from "@/lib/data/admin";

export function BlocksPanel({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const unban = async (u: AdminUser) => {
    setBusy(u.id);
    const res = await adminToggleBan(u.id, false);
    setBusy(null);
    if (res.ok) {
      toast("Пользователь разблокирован", "success");
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  if (users.length === 0) {
    return (
      <p className="rounded-card border border-panel-border bg-panel p-6 text-center text-[13px] text-ink-faint">
        Заблокированных пользователей нет
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-panel-border">
      <table className="w-full min-w-[680px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-panel-border bg-panel-hover/50 text-[11px] uppercase tracking-wider text-ink-faint">
            <th className="px-3 py-2.5 font-semibold">Пользователь</th>
            <th className="px-3 py-2.5 font-semibold">ID аккаунта</th>
            <th className="px-3 py-2.5 font-semibold">Баланс</th>
            <th className="px-3 py-2.5 font-semibold">Заблокирован</th>
            <th className="px-3 py-2.5 text-right font-semibold">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-panel-border">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-panel-hover/40">
              <td className="px-3 py-2.5 font-medium text-ink">{u.username}</td>
              <td className="px-3 py-2.5 font-mono text-[12px] text-ink-faint">
                {fmtAccountId(u.account_id)}
              </td>
              <td className="px-3 py-2.5 tabular text-ink">
                {fmtNumber(Math.round(u.balance))} ₽
              </td>
              <td className="px-3 py-2.5 text-ink-faint">{fmtDate(u.banned_at ?? u.created_at)}</td>
              <td className="px-3 py-2.5 text-right">
                <Button size="sm" variant="ok" loading={busy === u.id} onClick={() => unban(u)}>
                  <Check className="h-3.5 w-3.5" />
                  Разблокировать
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}