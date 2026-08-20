"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Ban, Check, Gift, Minus, Plus, Shield, Search } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Field } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import {
  adminAdjustBalance,
  adminIssueChip,
  adminSetRole,
  adminToggleBan,
} from "@/lib/actions/admin";
import { fmtAccountId, fmtDate, fmtNumber } from "@/lib/utils";
import type { AdminUser } from "@/lib/data/admin";

export function UsersPanel({
  initialUsers,
  total,
  pages,
  chips,
}: {
  initialUsers: AdminUser[];
  total: number;
  pages: number;
  chips: Array<{ id: string; name: string; rarity: { name: string } | null }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [search, setSearch] = useState(q);
  const [action, setAction] = useState<
    | { type: "balance"; user: AdminUser }
    | { type: "chip"; user: AdminUser }
    | null
  >(null);
  const [amount, setAmount] = useState("");
  const [chipId, setChipId] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const apply = (key: string, value: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set(key, value);
    if (key !== "page") sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  };

  const doAdjust = async (sign: 1 | -1) => {
    const value = parseFloat(amount);
    if (!value || value <= 0 || !action || action.type !== "balance") {
      toast("Введите сумму", "warning");
      return;
    }
    setBusy(true);
    const res = await adminAdjustBalance(action.user.id, sign * value);
    setBusy(false);
    if (res.ok) {
      toast("Баланс обновлён", "success");
      setAction(null);
      setAmount("");
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  const doIssue = async () => {
    if (!chipId || !action || action.type !== "chip") {
      toast("Выберите фишку", "warning");
      return;
    }
    setBusy(true);
    const res = await adminIssueChip(action.user.id, chipId);
    setBusy(false);
    if (res.ok) {
      toast("Фишка выдана", "success");
      setAction(null);
      setChipId("");
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  const toggleBan = async (u: AdminUser) => {
    setBusyUserId(u.id);
    const res = await adminToggleBan(u.id, !u.is_banned);
    setBusyUserId(null);
    if (res.ok) {
      toast(u.is_banned ? "Пользователь разблокирован" : "Пользователь заблокирован", "success");
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  const setRole = async (u: AdminUser, role: "user" | "admin") => {
    setBusyUserId(u.id);
    const res = await adminSetRole(u.id, role);
    setBusyUserId(null);
    if (res.ok) {
      toast("Роль обновлена", "success");
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form
          className="flex gap-2 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            apply("q", search);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-dim" />
            <Input
              className="pl-8 h-9 text-[13px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Имя или ID аккаунта…"
            />
          </div>
          <Button variant="secondary" size="sm" className="h-9">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </form>
        <span className="text-[11px] text-ink-faint shrink-0">{fmtNumber(total)} пользователей</span>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Пользователь</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Баланс</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Фишки</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Роль</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Дата</th>
                <th className="px-3 py-2 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-ink-faint">
                    Никого не найдено
                  </td>
                </tr>
              ) : (
                initialUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[rgb(var(--surface-hover))]/50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/users/${u.id}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {u.username}
                      </Link>
                      <p className="text-[10px] text-ink-faint font-mono">
                        {fmtAccountId(u.account_id)}
                        {u.email ? ` · ${u.email}` : ""}
                      </p>
                      {u.is_banned && (
                        <Badge variant="danger" className="mt-1">
                          Заблокирован
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular text-ink font-medium">
                      {fmtNumber(Math.round(u.balance))} ₽
                    </td>
                    <td className="px-3 py-2 tabular text-ink-faint">{fmtNumber(u.items)}</td>
                    <td className="px-3 py-2">
                      <Select
                        className="w-24 h-7 text-[11px]"
                        value={u.role}
                        disabled={busyUserId === u.id}
                        onChange={(e) => setRole(u, e.target.value as "user" | "admin")}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-ink-faint text-[11px]">{fmtDate(u.created_at)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          size="sm"
                          title="Пополнить"
                          onClick={() => setAction({ type: "balance", user: u })}
                          className="h-7 w-7"
                        >
                          <Plus className="h-3 w-3" />
                        </IconButton>
                        <IconButton
                          size="sm"
                          title="Списать"
                          onClick={() => setAction({ type: "balance", user: u })}
                          className="h-7 w-7"
                        >
                          <Minus className="h-3 w-3" />
                        </IconButton>
                        <IconButton
                          size="sm"
                          title="Выдать фишку"
                          onClick={() => setAction({ type: "chip", user: u })}
                          className="h-7 w-7"
                        >
                          <Gift className="h-3 w-3" />
                        </IconButton>
                        <IconButton
                          size="sm"
                          title={u.is_banned ? "Разблокировать" : "Заблокировать"}
                          loading={busyUserId === u.id}
                          onClick={() => toggleBan(u)}
                          className="h-7 w-7"
                        >
                          {u.is_banned ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Ban className="h-3 w-3" />
                          )}
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination pages={pages} current={page} />
        </div>
      )}

      {/* Balance modal */}
      <Modal
        open={action?.type === "balance"}
        onClose={() => setAction(null)}
        title={`Баланс: ${action?.user.username ?? ""}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAction(null)}>Отмена</Button>
            <Button size="sm" variant="primary" loading={busy} onClick={() => doAdjust(1)}>Пополнить</Button>
            <Button size="sm" variant="danger" loading={busy} onClick={() => doAdjust(-1)}>Списать</Button>
          </>
        }
      >
        <Field label="Сумма, ₽">
          <Input
            type="number"
            min={1}
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
      </Modal>

      {/* Chip modal */}
      <Modal
        open={action?.type === "chip"}
        onClose={() => setAction(null)}
        title={`Выдать фишку: ${action?.user.username ?? ""}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAction(null)}>Отмена</Button>
            <Button size="sm" variant="primary" loading={busy} onClick={doIssue}>
              <Gift className="h-3.5 w-3.5" />
              Выдать
            </Button>
          </>
        }
      >
        <Field label="Фишка">
          <Select value={chipId} onChange={(e) => setChipId(e.target.value)}>
            <option value="">Выберите фишку…</option>
            {chips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.rarity?.name ?? ""}
              </option>
            ))}
          </Select>
        </Field>
        <p className="mt-2 text-[10px] text-ink-faint">
          Экземпляр выдаётся без lock и засчитывается в тираж коллекции.
        </p>
      </Modal>
    </div>
  );
}