"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { adminResolveRequest } from "@/lib/actions/admin";
import { fmtDate, fmtNumber } from "@/lib/utils";

export function PendingRequests({
  requests,
}: {
  requests: Array<{
    id: number;
    user: { username: string } | null;
    type: string;
    amount: number;
    created_at: string;
  }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<number | null>(null);

  const resolve = async (id: number, approve: boolean) => {
    setBusy(id);
    const res = await adminResolveRequest(id, approve);
    setBusy(null);
    if (res.ok) {
      toast(approve ? "Заявка одобрена" : "Заявка отклонена", "success");
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  if (requests.length === 0) {
    return <p className="px-4 py-3 text-[13px] text-ink-faint">Нет ожидающих заявок</p>;
  }

  return (
    <div className="divide-y divide-panel-border">
      {requests.map((r) => (
        <div key={r.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">
              {r.user?.username ?? "—"}
              <span className="ml-2 text-ink-faint">
                {r.type === "deposit" ? "пополнение" : "вывод"}
              </span>
            </p>
            <p className="text-[11px] text-ink-faint">
              {fmtDate(r.created_at)} · запрос #{r.id}
            </p>
          </div>
          <span
            className={
              r.type === "deposit"
                ? "tabular text-[14px] font-bold text-ok"
                : "tabular text-[14px] font-bold text-danger"
            }
          >
            {r.type === "deposit" ? "+" : "−"}{fmtNumber(Math.round(r.amount))} ₽
          </span>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ok"
              loading={busy === r.id}
              onClick={() => resolve(r.id, true)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={busy === r.id}
              onClick={() => resolve(r.id, false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-panel-border bg-panel p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl font-bold tabular text-ink">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink-dim">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "ok" | "warn" | "info" | "danger" | "neutral"> = {
    completed: "ok",
    pending: "warn",
    cancelled: "neutral",
    rejected: "danger",
    deposit: "ok",
    withdraw: "danger",
    listed: "ok",
    sold: "info",
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}
