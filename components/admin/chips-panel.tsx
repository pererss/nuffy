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
    name: "", collection_id: "", rarity_id: "", level_id: "",
    number: "", base_price: "", total_minted: "", status: "active" as "active" | "disabled" | "draft",
  });
  const [image, setImage] = useState<{ url: string; crop: { x: number; y: number; zoom: number } } | null>(null);
  const [busy, setBusy] = useState(false);

  const list = collectionFilter ? chips.filter((c) => c.collection_id === collectionFilter) : chips;

  const open = (c: typeof chips[number] | "new") => {
    setEditing(c);
    setImage(null);
    setForm(
      c === "new"
        ? { name: "", collection_id: collectionFilter || collections[0]?.id || "", rarity_id: rarities[0]?.id || "", level_id: levels[0]?.id || "", number: "", base_price: "", total_minted: "", status: "active" }
        : { name: c.name, collection_id: c.collection_id, rarity_id: c.rarity_id, level_id: c.level_id, number: String(c.number), base_price: String(c.base_price), total_minted: String(c.total_minted), status: c.status }
    );
  };

  const save = async () => {
    if (!form.name.trim()) { toast("Название обязательно", "warning"); return; }
    setBusy(true);
    const res = await adminSaveChip({
      id: editing === "new" ? "new" : (editing as typeof chips[number]).id,
      name: form.name.trim(),
      collection_id: form.collection_id,
      rarity_id: form.rarity_id,
      level_id: form.level_id,
      number: parseInt(form.number) || 0,
      base_price: parseFloat(form.base_price) || 0,
      total_minted: parseInt(form.total_minted) || 0,
      status: form.status as "active" | "disabled" | "draft",
      image_url: image?.url ?? (editing === "new" ? null : (editing as typeof chips[number]).image_url),
      image_crop: image?.crop ?? (editing === "new" ? undefined : (editing as typeof chips[number]).image_crop),
    });
    setBusy(false);
    if (res.ok) { toast("Сохранено", "success"); setEditing(null); router.refresh(); }
    else toast(res.error ?? "Ошибка", "error");
  };

  const remove = async (c: typeof chips[number]) => {
    setBusy(true);
    const res = await adminDeleteChip(c.id);
    setBusy(false);
    if (res.ok) { toast("Удалено", "success"); router.refresh(); }
    else toast(res.error ?? "Ошибка", "error");
  };

  return (
    <div>
      {/* Collection filter */}
      <div className="mb-4 flex items-center gap-2">
        <Select
          className="w-48 h-9 text-[13px]"
          value={collectionFilter}
          onChange={(e) => {
            const sp = new URLSearchParams(searchParams.toString());
            e.target.value ? sp.set("collection", e.target.value) : sp.delete("collection");
            sp.delete("page");
            router.push(`${pathname}?${sp.toString()}`);
          }}
        >
          <option value="">Все коллекции</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Button variant="primary" size="sm" onClick={() => open("new")} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Новая фишка
        </Button>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-[13px]">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Фишка</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Коллекция</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Редкость</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Цена</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Тираж</th>
                <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">Статус</th>
                <th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {list.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-[rgb(var(--surface-hover))]/50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <ChipImage name={c.name} imageUrl={c.image_url} crop={c.image_crop} rarity={c.rarity.slug} size={36} />
                      <div>
                        <span className="font-medium text-ink">{c.name}</span>
                        <span className="block text-[10px] text-ink-faint">№{c.number}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{c.collection?.name ?? "—"}</td>
                  <td className="px-3 py-2"><Badge color={c.rarity.color} tone="dot">{c.rarity.name}</Badge></td>
                  <td className="px-3 py-2 tabular text-ink font-medium">{fmtNumber(c.base_price)} ₽</td>
                  <td className="px-3 py-2 tabular text-ink-faint">{fmtNumber(c.total_minted)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={c.status === "active" ? "ok" : "neutral"}>{c.status}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => open(c)} className="h-7 w-7 p-0">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(c)} className="h-7 w-7 p-0">
                        <Trash2 className="h-3 w-3 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Новая фишка" : `Редактирование: ${editing?.name ?? ""}`}
        size="md"
        actions={
          <>
            {editing && editing !== "new" && (
              <Button variant="danger" size="sm" loading={busy} className="mr-auto" onClick={() => remove(editing)}>
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Отмена</Button>
            <Button variant="primary" size="sm" loading={busy} onClick={save}>Сохранить</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <CropImage
            bucket="chips"
            folder={editing === "new" ? "chips/new" : `chips/${(editing as typeof chips[number]).id}`}
            value={image?.url ?? (editing === "new" ? null : (editing as typeof chips[number]).image_url)}
            crop={image?.crop ?? null}
            onChange={(c) => setImage(c)}
          />
          <div className="flex flex-col gap-3">
            <Field label="Название">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Коллекция">
                <Select value={form.collection_id} onChange={(e) => setForm({ ...form, collection_id: e.target.value })}>
                  <option value="">Выберите…</option>
                  {collections.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </Select>
              </Field>
              <Field label="Редкость">
                <Select value={form.rarity_id} onChange={(e) => setForm({ ...form, rarity_id: e.target.value })}>
                  <option value="">Выберите…</option>
                  {rarities.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </Select>
              </Field>
              <Field label="Уровень">
                <Select value={form.level_id} onChange={(e) => setForm({ ...form, level_id: e.target.value })}>
                  <option value="">Выберите…</option>
                  {levels.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
                </Select>
              </Field>
              <Field label="Номер">
                <Input type="number" min={1} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </Field>
              <Field label="Цена, ₽">
                <Input type="number" min={0} value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
              </Field>
              <Field label="Тираж">
                <Input type="number" min={1} value={form.total_minted} onChange={(e) => setForm({ ...form, total_minted: e.target.value })} />
              </Field>
            </div>
            <Field label="Статус">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "disabled" | "draft" })}>
                <option value="active">active</option>
                <option value="disabled">disabled</option>
                <option value="draft">draft</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}