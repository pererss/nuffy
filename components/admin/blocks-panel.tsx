"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Check } from "lucide-react";
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
      <div className="panel p-6 text-center text-[13px] text-ink-faint">
        Заблокированных пользователей нет
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
              <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Пользователь</th>
              <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">ID аккаунта</th>
              <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Баланс</th>
              <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Заблокирован</th>
              <th className="px-3 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-[rgb(var(--surface-hover))]/50">
                <td className="px-3 py-2 font-medium text-ink">{u.username}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-ink-faint">{fmtAccountId(u.account_id)}</td>
                <td className="px-3 py-2 tabular text-ink font-medium">{fmtNumber(Math.round(u.balance))} ₽</td>
                <td className="px-3 py-2 text-ink-faint text-[11px]">{fmtDate(u.banned_at ?? u.created_at)}</td>
                <td className="px-3 py-2">
                  <Button size="sm" variant="ok" loading={busy === u.id} onClick={() => unban(u)} className="gap-1">
                    <Check className="h-3 w-3" />
                    Разблокировать
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}