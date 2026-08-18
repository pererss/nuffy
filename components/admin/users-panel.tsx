"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Ban, Check, Gift, Minus, Plus, Shield, Search, Trophy } from "lucide-react";
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply("q", search);
          }}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Имя или ID аккаунта…"
            className="w-72"
          />
          <Button variant="secondary" size="sm">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </form>
        <span className="text-[12px] text-ink-faint">{fmtNumber(total)} пользователей</span>
      </div>

      <div className="overflow-x-auto rounded-card border border-panel-border">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-panel-border bg-panel-hover/50 text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-3 py-2.5 font-semibold">Пользователь</th>
              <th className="px-3 py-2.5 font-semibold">Баланс</th>
              <th className="px-3 py-2.5 font-semibold">Фишки</th>
              <th className="px-3 py-2.5 font-semibold">Роль</th>
              <th className="px-3 py-2.5 font-semibold">Дата</th>
              <th className="px-3 py-2.5 text-right font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-border">
            {initialUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-faint">
                  Никого не найдено
                </td>
              </tr>
            ) : (
              initialUsers.map((u) => (
                <tr key={u.id} className="hover:bg-panel-hover/40">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/users/${u.id}`}
                      className="font-medium text-ink hover:text-brand"
                    >
                      {u.username}
                    </Link>
                    <p className="text-[11px] text-ink-faint">
                      {fmtAccountId(u.account_id)}
                      {u.email ? ` · ${u.email}` : ""}
                    </p>
                    {u.is_banned && (
                      <Badge variant="danger" className="mt-1">
                        Заблокирован
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular text-ink">
                    {fmtNumber(Math.round(u.balance))} ₽
                  </td>
                  <td className="px-3 py-2.5 tabular text-ink-faint">{fmtNumber(u.items)}</td>
                  <td className="px-3 py-2.5">
                    <Select
                      className="w-28"
                      value={u.role}
                      disabled={busyUserId === u.id}
                      onChange={(e) => setRole(u, e.target.value as "user" | "admin")}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </Select>
                  </td>
                  <td className="px-3 py-2.5 text-ink-faint">{fmtDate(u.created_at)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        size="sm"
                        title="Пополнить баланс"
                        onClick={() => setAction({ type: "balance", user: u })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        size="sm"
                        title="Списать с баланса"
                        onClick={() => setAction({ type: "balance", user: u })}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        size="sm"
                        title="Выдать фишку"
                        onClick={() => setAction({ type: "chip", user: u })}
                      >
                        <Gift className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        size="sm"
                        title={u.is_banned ? "Разблокировать" : "Заблокировать"}
                        loading={busyUserId === u.id}
                        onClick={() => toggleBan(u)}
                      >
                        {u.is_banned ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
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

      {pages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination pages={pages} current={page} />
        </div>
      )}

      <Modal
        open={action?.type === "balance"}
        onClose={() => setAction(null)}
        title={`Баланс: ${action?.user.username ?? ""}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAction(null)}>
              Отмена
            </Button>
            <Button size="sm" variant="primary" loading={busy} onClick={() => doAdjust(1)}>
              Пополнить
            </Button>
            <Button size="sm" variant="danger" loading={busy} onClick={() => doAdjust(-1)}>
              Списать
            </Button>
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

      <Modal
        open={action?.type === "chip"}
        onClose={() => setAction(null)}
        title={`Выдать фишку: ${action?.user.username ?? ""}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAction(null)}>
              Отмена
            </Button>
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
        <p className="mt-3 text-xs text-ink-faint">
          Экземпляр выдаётся без lock и засчитывается в тираж коллекции.
        </p>
      </Modal>
    </div>
  );
}
