"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Field, Checkbox } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { adminSavePromo, adminDeletePromo } from "@/lib/actions/admin";
import { fmtNumber } from "@/lib/utils";
import type { PromoCode } from "@/lib/types";

export function PromosPanel({ promos }: { promos: PromoCode[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<PromoCode | "new" | null>(null);
  const [form, setForm] = useState({
    code: "",
    bonus_type: "fixed",
    bonus_value: "",
    max_uses: "",
    per_user_limit: "1",
    starts_at: "",
    ends_at: "",
    is_active: true,
  });
  const [busy, setBusy] = useState(false);

  const open = (p: PromoCode | "new") => {
    setEditing(p);
    setForm(
      p === "new"
        ? {
            code: "",
            bonus_type: "fixed",
            bonus_value: "",
            max_uses: "",
            per_user_limit: "1",
            starts_at: "",
            ends_at: "",
            is_active: true,
          }
        : {
            code: p.code,
            bonus_type: p.bonus_type,
            bonus_value: String(p.bonus_value),
            max_uses: p.max_uses ? String(p.max_uses) : "",
            per_user_limit: String(p.per_user_limit ?? 1),
            starts_at: (p.starts_at ?? "").slice(0, 16),
            ends_at: (p.ends_at ?? "").slice(0, 16),
            is_active: p.is_active,
          }
    );
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast("Код обязателен", "warning");
      return;
    }
    setBusy(true);
    const res = await adminSavePromo({
      id: editing === "new" ? "new" : (editing as PromoCode).id,
      code: form.code.trim(),
      bonus_type: form.bonus_type as "fixed" | "percent",
      bonus_value: parseFloat(form.bonus_value) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : 0,
      per_user_limit: parseInt(form.per_user_limit) || 1,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active,
    });
    setBusy(false);
    if (res.ok) {
      toast("Сохранено", "success");
      setEditing(null);
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  const remove = async () => {
    if (!editing || editing === "new") return;
    setBusy(true);
    const res = await adminDeletePromo(editing.id);
    setBusy(false);
    if (res.ok) {
      toast("Промокод удалён", "success");
      setEditing(null);
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" size="sm" onClick={() => open("new")}>
          <Plus className="h-4 w-4" />
          Новый промокод
        </Button>
      </div>

      <div className="overflow-x-auto rounded-card border border-panel-border">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-panel-border bg-panel-hover/50 text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-3 py-2.5 font-semibold">Код</th>
              <th className="px-3 py-2.5 font-semibold">Бонус</th>
              <th className="px-3 py-2.5 font-semibold">Лимиты</th>
              <th className="px-3 py-2.5 font-semibold">Сроки</th>
              <th className="px-3 py-2.5 font-semibold">Статус</th>
              <th className="px-3 py-2.5 text-right font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-border">
            {promos.map((p) => (
              <tr key={p.id} className="hover:bg-panel-hover/40">
                <td className="px-3 py-2.5 font-mono font-bold tracking-wider text-brand">
                  {p.code}
                </td>
                <td className="px-3 py-2.5 tabular text-ink">
                  {p.bonus_type === "percent"
                    ? `${p.bonus_value}%`
                    : `${fmtNumber(Math.round(p.bonus_value))} ₽`}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-ink-faint">
                  {p.max_uses > 0 ? `${fmtNumber(p.max_uses)} всего` : "∞ всего"} ·{" "}
                  {fmtNumber(p.per_user_limit ?? 1)} на юзера
                </td>
                <td className="px-3 py-2.5 text-[11px] text-ink-faint">
                  {p.starts_at ? p.starts_at.slice(0, 16).replace("T", " ") : "—"}
                  {p.ends_at ? ` → ${p.ends_at.slice(0, 16).replace("T", " ")}` : ""}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={p.is_active ? "ok" : "neutral"}>
                    {p.is_active ? "активен" : "выкл"}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => open(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => open(p)}>
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing === null
            ? ""
            : editing === "new"
              ? "Новый промокод"
              : `Редактирование: ${editing.code}`
        }
        actions={
          <>
            {editing && editing !== "new" && (
              <Button
                variant="danger"
                size="sm"
                loading={busy}
                className="mr-auto"
                onClick={remove}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button variant="primary" size="sm" loading={busy} onClick={save}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Код">
              <Input
                className="font-mono uppercase"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="NUFFY100"
              />
            </Field>
            <Field label="Тип бонуса">
              <Select
                value={form.bonus_type}
                onChange={(e) => setForm({ ...form, bonus_type: e.target.value })}
              >
                <option value="fixed">Фиксированная сумма, ₽</option>
                <option value="percent">Процент</option>
              </Select>
            </Field>
            <Field label={form.bonus_type === "percent" ? "Процент" : "Сумма, ₽"}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.bonus_value}
                onChange={(e) => setForm({ ...form, bonus_value: e.target.value })}
              />
            </Field>
            <Field label="Лимит на пользователя">
              <Input
                type="number"
                min={1}
                value={form.per_user_limit}
                onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })}
              />
            </Field>
            <Field label="Макс. использований (0 = ∞)">
              <Input
                type="number"
                min={0}
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Начало">
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </Field>
            <Field label="Конец">
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <Checkbox
              checked={form.is_active}
              onChange={(v) => setForm({ ...form, is_active: v })}
            />
            Промокод активен
          </label>
        </div>
      </Modal>
    </div>
  );
}