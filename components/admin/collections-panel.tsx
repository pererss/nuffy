"use client";

import { useMemo, useState } from "react";
import { Search, Edit, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/form";
import { cn, fmtNumber } from "@/lib/utils";
import type { Collection } from "@/lib/types";

export function CollectionsPanel({
  collections,
  chipsCount,
}: {
  collections: Collection[];
  chipsCount: Record<string, number>;
}) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Collection | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return collections;
    const s = q.trim().toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(s));
  }, [collections, q]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-dim" />
          <Input
            className="pl-8 h-9 text-[13px]"
            placeholder="Поиск коллекций…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="primary" size="sm" className="h-9 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Создать
        </Button>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
                <th className="px-4 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Название</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Тираж</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Продано</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Осталось</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Статус</th>
                <th className="px-4 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">Дата</th>
                <th className="px-4 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {filtered.map((c) => {
                const total = chipsCount[c.id] ?? c.total_minted ?? 0;
                const sold = c.sold_count ?? 0;
                const remaining = total - sold;
                return (
                  <tr key={c.id} className="transition-colors hover:bg-[rgb(var(--surface-hover))]/50">
                    <td className="px-4 py-2.5 font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-2.5 tabular text-ink-soft">{fmtNumber(total)}</td>
                    <td className="px-4 py-2.5 tabular text-ink-soft">{fmtNumber(sold)}</td>
                    <td className="px-4 py-2.5 tabular text-ink-soft">{fmtNumber(remaining)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "inline-flex h-5 items-center rounded-[3px] px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em]",
                        c.status === "active"
                          ? "bg-ok/10 text-ok border border-ok/25"
                          : c.status === "sold_out"
                          ? "bg-danger/10 text-danger border border-danger/25"
                          : "bg-[rgb(var(--surface-hover))] text-ink-faint border border-[rgb(var(--border))]"
                      )}>
                        {c.status === "active" ? "ACTIVE" : c.status === "sold_out" ? "SOLD OUT" : c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular text-ink-faint">{c.released_at ? new Date(c.released_at).toLocaleDateString("ru") : "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(c);
                            setEditName(c.name);
                            setEditDesc(c.description ?? "");
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-[4px] text-ink-faint transition-colors hover:bg-[rgb(var(--surface-hover))] hover:text-ink"
                          title="Редактировать"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-[4px] text-ink-faint transition-colors hover:bg-[rgb(var(--surface-hover))] hover:text-ink" title="Ещё">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-[13px] text-ink-faint">
            Ничего не найдено
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Редактировать коллекцию"
        size="sm"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Отмена</Button>
            <Button variant="primary" size="sm">Сохранить</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label="Название">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field label="Описание">
            <textarea
              className="input-base min-h-20 resize-y"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}