"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Field } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ChipImage } from "@/components/chips/chip-image";
import { useToast } from "@/components/ui/toast";
import { adminSaveChip, adminDeleteChip } from "@/lib/actions/admin";
import { CropImage } from "@/components/admin/crop-image";
import { fmtNumber } from "@/lib/utils";
import type { ChipWithMeta, Collection, Rarity, Level } from "@/lib/types";

export function ChipsPanel({
  chips,
  collections,
  rarities,
  levels,
}: {
  chips: Array<
    ChipWithMeta & {
      collection: { name: string; status: string } | null;
      rarity: { slug: string; name: string };
      level: { name: string } | null;
    }
  >;
  collections: Collection[];
  rarities: Rarity[];
  levels: Level[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const collectionFilter = searchParams.get("collection") ?? "";

  const [editing, setEditing] = useState<typeof chips[number] | "new" | null>(null);
  const [form, setForm] = useState({
    name: "",
    collection_id: "",
    rarity_id: "",
    level_id: "",
    number: "",
    base_price: "",
    total_minted: "",
    status: "active",
  });
  const [image, setImage] = useState<{ url: string; crop: { x: number; y: number; zoom: number } } | null>(null);
  const [busy, setBusy] = useState(false);

  const list = collectionFilter ? chips.filter((c) => c.collection_id === collectionFilter) : chips;

  const open = (c: typeof chips[number] | "new") => {
    setEditing(c);
    setImage(null);
    setForm(
      c === "new"
        ? {
            name: "",
            collection_id: collectionFilter || collections[0]?.id || "",
            rarity_id: rarities[0]?.id || "",
            level_id: levels[0]?.id || "",
            number: "",
            base_price: "",
            total_minted: "",
            status: "active",
          }
        : {
            name: c.name,
            collection_id: c.collection_id,
            rarity_id: c.rarity_id,
            level_id: c.level_id,
            number: String(c.number),
            base_price: String(c.base_price),
            total_minted: String(c.total_minted),
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
    const res = await adminSaveChip({
      id: editing === "new" ? "new" : (editing as typeof chips[number]).id,
      name: form.name.trim(),
      collection_id: form.collection_id,
      rarity_id: form.rarity_id,
      level_id: form.level_id,
      number: parseInt(form.number) || 1,
      base_price: parseFloat(form.base_price) || 0,
      total_minted: parseInt(form.total_minted) || 0,
      status: form.status as ChipWithMeta["status"],
      image_url: image?.url ?? (editing === "new" ? null : (editing as typeof chips[number]).image_url),
      image_crop: image?.crop ??
        (editing === "new"
          ? { x: 0.5, y: 0.5, zoom: 1 }
          : (editing as typeof chips[number]).image_crop),
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
    const res = await adminDeleteChip(editing.id);
    setBusy(false);
    if (res.ok) {
      toast("Фишка скрыта", "success");
      setEditing(null);
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          className="w-64"
          value={collectionFilter}
          onChange={(e) => {
            const sp = new URLSearchParams(searchParams.toString());
            if (e.target.value) sp.set("collection", e.target.value);
            else sp.delete("collection");
            router.push(`${pathname}?${sp.toString()}`);
          }}
        >
          <option value="">Все коллекции</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <span className="text-[12px] text-ink-faint">{fmtNumber(list.length)} фишек</span>
        <Button variant="primary" size="sm" className="ml-auto" onClick={() => open("new")}>
          <Plus className="h-4 w-4" />
          Новая фишка
        </Button>
      </div>

      <div className="overflow-x-auto rounded-card border border-panel-border">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-panel-border bg-panel-hover/50 text-[11px] uppercase tracking-wider text-ink-faint">
              <th className="px-3 py-2.5 font-semibold">Фишка</th>
              <th className="px-3 py-2.5 font-semibold">Коллекция</th>
              <th className="px-3 py-2.5 font-semibold">Редкость</th>
              <th className="px-3 py-2.5 font-semibold">Цена</th>
              <th className="px-3 py-2.5 font-semibold">Тираж</th>
              <th className="px-3 py-2.5 font-semibold">Продано</th>
              <th className="px-3 py-2.5 font-semibold">Статус</th>
              <th className="px-3 py-2.5 text-right font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-border">
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-ink-faint">
                  Фишек нет
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <tr key={c.id} className="hover:bg-panel-hover/40">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <ChipImage
                        name={c.name}
                        imageUrl={c.image_url}
                        crop={c.image_crop}
                        rarity={c.rarity?.slug ?? "common"}
                        size={40}
                      />
                      <div>
                        <p className="font-medium text-ink">{c.name}</p>
                        <p className="text-[11px] text-ink-faint">№{c.number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-ink-soft">{c.collection?.name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-ink-soft">{c.rarity?.name ?? "—"}</td>
                  <td className="px-3 py-2.5 tabular text-ink">{fmtNumber(Math.round(c.base_price))} ₽</td>
                  <td className="px-3 py-2.5 tabular text-ink-faint">{fmtNumber(c.total_minted)}</td>
                  <td className="px-3 py-2.5 tabular text-ink-faint">{fmtNumber(c.sold_count)}</td>
                  <td className="px-3 py-2.5">
                    <Badge
                      variant={
                        c.status === "active"
                          ? c.sold_count >= c.total_minted
                            ? "warn"
                            : "ok"
                          : "neutral"
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => open(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {c.status !== "disabled" && (
                        <Button variant="ghost" size="sm" onClick={() => open(c)}>
                          <Trash2 className="h-3.5 w-3.5 text-danger" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Новая фишка" : `Редактирование: ${editing?.name ?? ""}`}
        size="md"
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
                Скрыть
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
            bucket="chips"
            folder={editing === "new" ? "chips/new" : `chips/${(editing as typeof chips[number]).id}`}
            value={image?.url ?? (editing === "new" ? null : (editing as typeof chips[number]).image_url)}
            crop={image?.crop ?? (editing === "new" ? null : (editing as typeof chips[number]).image_crop)}
            onChange={(c) => setImage(c)}
          />
          <div className="flex flex-col gap-4">
            <Field label="Название">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Коллекция">
                <Select
                  value={form.collection_id}
                  onChange={(e) => setForm({ ...form, collection_id: e.target.value })}
                >
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Номер">
                <Input
                  type="number"
                  min={1}
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                />
              </Field>
              <Field label="Редкость">
                <Select
                  value={form.rarity_id}
                  onChange={(e) => setForm({ ...form, rarity_id: e.target.value })}
                >
                  {rarities.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Уровень (лист)">
                <Select
                  value={form.level_id}
                  onChange={(e) => setForm({ ...form, level_id: e.target.value })}
                >
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Цена, ₽">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                />
              </Field>
              <Field label="Тираж (всего, шт.)">
                <Input
                  type="number"
                  min={0}
                  value={form.total_minted}
                  onChange={(e) => setForm({ ...form, total_minted: e.target.value })}
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
                <option value="disabled">disabled</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
