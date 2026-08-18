"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Field } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { adminSavePack, adminCreatePackVersion, adminDeletePack } from "@/lib/actions/admin";
import { CropImage } from "@/components/admin/crop-image";
import { fmtNumber } from "@/lib/utils";
import type { Pack } from "@/lib/types";

export function PacksPanel({
  packs,
  versionsCount,
}: {
  packs: Pack[];
  versionsCount: Record<string, number>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Pack | "new" | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    available_count: "",
    starts_at: "",
    ends_at: "",
    status: "draft",
  });
  const [image, setImage] = useState<{ url: string; crop: { x: number; y: number; zoom: number } } | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (p: Pack | "new") => {
    setEditing(p);
    setImage(null);
    setForm(
      p === "new"
        ? { name: "", description: "", price: "", available_count: "", starts_at: "", ends_at: "", status: "draft" }
        : {
            name: p.name,
            description: p.description ?? "",
            price: String(p.price),
            available_count: p.available_count != null ? String(p.available_count) : "",
            starts_at: (p.starts_at ?? "").slice(0, 16),
            ends_at: (p.ends_at ?? "").slice(0, 16),
            status: p.status,
          }
    );
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast("Название обязательно", "warning");
      return;
    }
    setBusy(true);
    const res = await adminSavePack({
      id: editing === "new" ? "new" : (editing as Pack).id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
      available_count: form.available_count ? parseInt(form.available_count) : null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      status: form.status as Pack["status"],
      image_url: image?.url ?? (editing === "new" ? null : (editing as Pack).image_url),
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

  const end = async () => {
    if (!editing || editing === "new") return;
    setBusy(true);
    const res = await adminDeletePack(editing.id);
    setBusy(false);
    if (res.ok) {
      toast("Пак завершён", "success");
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
          Новый пак
        </Button>
      </div>

      <div className="overflow-x-auto rounded-card border border-panel-border">
        <table className="w-full min-w-[780px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-panel-border bg-panel-hover/50 text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-3 py-2.5 font-semibold">Пак</th>
              <th className="px-3 py-2.5 font-semibold">Цена</th>
              <th className="px-3 py-2.5 font-semibold">Остаток</th>
              <th className="px-3 py-2.5 font-semibold">Версий</th>
              <th className="px-3 py-2.5 font-semibold">Статус</th>
              <th className="px-3 py-2.5 font-semibold">Окно продаж</th>
              <th className="px-3 py-2.5 text-right font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-border">
            {packs.map((p) => (
              <tr key={p.id} className="hover:bg-panel-hover/40">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-9 w-9 rounded-lg border border-panel-border object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel-hover text-[11px] font-bold text-ink-faint">
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium text-ink">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 tabular text-ink">{fmtNumber(Math.round(p.price))} ₽</td>
                <td className="px-3 py-2.5 tabular text-ink-faint">
                  {p.available_count != null ? fmtNumber(p.available_count) : "∞"}
                </td>
                <td className="px-3 py-2.5 tabular text-ink-faint">{versionsCount[p.id] ?? 0}</td>
                <td className="px-3 py-2.5">
                  <Badge
                    variant={
                      p.status === "active" ? "ok" : p.status === "ended" ? "neutral" : "warn"
                    }
                  >
                    {p.status}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-[11px] text-ink-faint">
                  {p.starts_at ? p.starts_at.slice(0, 16).replace("T", " ") : "—"}
                  {p.ends_at ? ` → ${p.ends_at.slice(0, 16).replace("T", " ")}` : ""}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/admin/packs/${p.id}`)}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Версии
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => open(p)}>
                      <Pencil className="h-3.5 w-3.5" />
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
        title={editing === "new" ? "Новый пак" : `Редактирование: ${editing?.name ?? ""}`}
        size="md"
        actions={
          <>
            {editing && editing !== "new" && (
              <Button
                variant="danger"
                size="sm"
                loading={busy}
                className="mr-auto"
                onClick={end}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Завершить
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
        <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
          <CropImage
            bucket="packs"
            folder={editing === "new" ? "packs/new" : `packs/${(editing as Pack).id}`}
            value={image?.url ?? (editing === "new" ? null : (editing as Pack).image_url)}
            crop={image?.crop ?? null}
            onChange={(c) => setImage(c)}
          />
          <div className="flex flex-col gap-4">
            <Field label="Название">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Описание">
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Цена, ₽">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
              <Field label="Доступно (пусто = ∞)">
                <Input
                  type="number"
                  min={0}
                  value={form.available_count}
                  onChange={(e) => setForm({ ...form, available_count: e.target.value })}
                />
              </Field>
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
            <Field label="Статус">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="ended">ended</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}