"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Field, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { adminSaveCollection } from "@/lib/actions/admin";
import { CropImage } from "@/components/admin/crop-image";
import { fmtNumber } from "@/lib/utils";
import type { Collection } from "@/lib/types";

export function CollectionsPanel({
  collections,
  chipsCount,
}: {
  collections: Collection[];
  chipsCount: Record<string, number>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Collection | "new" | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    total_minted: "",
    released_at: "",
    status: "active",
  });
  const [image, setImage] = useState<{ url: string; crop: { x: number; y: number; zoom: number } } | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (c: Collection | "new") => {
    setEditing(c);
    setImage(null);
    setForm(
      c === "new"
        ? { name: "", description: "", total_minted: "", released_at: "", status: "active" }
        : {
            name: c.name,
            description: c.description ?? "",
            total_minted: String(c.total_minted),
            released_at: (c.released_at ?? "").slice(0, 10),
            status: c.status,
          }
    );
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast("Название обязательно", "warning");
      return;
    }
    setBusy(true);
    const res = await adminSaveCollection({
      id: editing === "new" ? "new" : (editing as Collection).id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      image_url: image?.url ?? (editing === "new" ? null : (editing as Collection).image_url),
      total_minted: parseInt(form.total_minted) || 0,
      released_at: form.released_at ? new Date(form.released_at).toISOString() : new Date().toISOString(),
      status: form.status as Collection["status"],
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

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" size="sm" onClick={() => open("new")}>
          <Plus className="h-4 w-4" />
          Новая коллекция
        </Button>
      </div>

      <div className="overflow-x-auto rounded-card border border-panel-border">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-panel-border bg-panel-hover/50 text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-3 py-2.5 font-semibold">Коллекция</th>
              <th className="px-3 py-2.5 font-semibold">Статус</th>
              <th className="px-3 py-2.5 font-semibold">Фишек</th>
              <th className="px-3 py-2.5 font-semibold">Тираж</th>
              <th className="px-3 py-2.5 font-semibold">Продано</th>
              <th className="px-3 py-2.5 text-right font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-border">
            {collections.map((c) => {
              const pct = c.total_minted > 0 ? Math.round((c.sold_count / c.total_minted) * 100) : 0;
              return (
                <tr key={c.id} className="hover:bg-panel-hover/40">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="h-9 w-9 rounded-lg border border-panel-border object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel-hover text-[11px] font-bold text-ink-faint">
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="font-medium text-ink">{c.name}</p>
                        <p className="text-[11px] text-ink-faint">{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      variant={
                        c.status === "active"
                          ? "ok"
                          : c.status === "sold_out"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 tabular text-ink-faint">
                    {fmtNumber(chipsCount[c.id] ?? 0)}
                  </td>
                  <td className="px-3 py-2.5 tabular text-ink">{fmtNumber(c.total_minted)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-base-inset">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="tabular text-[11px] text-ink-faint">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => open(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Изменить
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Новая коллекция" : "Редактирование коллекции"}
        size="md"
        actions={
          <>
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
            bucket="collections"
            folder={
              editing === "new" ? `collections/new` : `collections/${(editing as Collection).id}`
            }
            value={image?.url ?? (editing === "new" ? null : (editing as Collection).image_url)}
            crop={image?.crop ?? null}
            onChange={(c) => setImage(c)}
          />
          <div className="flex flex-col gap-4">
            <Field label="Название">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Neon Genesis"
              />
            </Field>
            <Field label="Описание">
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Тираж (всего экземпляров, шт.)`}>
                <Input
                  type="number"
                  min={0}
                  value={form.total_minted}
                  onChange={(e) => setForm({ ...form, total_minted: e.target.value })}
                />
              </Field>
              <Field label="Дата релиза">
                <Input
                  type="date"
                  value={form.released_at}
                  onChange={(e) => setForm({ ...form, released_at: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Статус">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">draft</option>
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="sold_out">sold_out</option>
                <option value="archived">archived</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}