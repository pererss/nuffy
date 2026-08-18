"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { adminCreatePackVersion } from "@/lib/actions/admin";
import { fmtNumber } from "@/lib/utils";
import type { Rarity } from "@/lib/types";

type TierRow = { rarity_id: string; weight: string };
type ItemRow = { chip_id: string; weight: string };

export function PackVersionsEditor({
  packId,
  packName,
  versions,
  chips,
  rarities,
}: {
  packId: string;
  packName: string;
  versions: Array<Record<string, unknown>>;
  chips: Array<{ id: string; name: string; rarity: { slug: string; name: string } | null }>;
  rarities: Rarity[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<TierRow[]>([
    ...rarities.map((r) => ({ rarity_id: r.id, weight: "" })),
  ]);
  const [itemsByTier, setItemsByTier] = useState<Record<string, ItemRow[]>>({});
  const [busy, setBusy] = useState(false);

  const tierWeightSum = () =>
    tiers.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
  const itemsSum = (rarityId: string) =>
    (itemsByTier[rarityId] ?? []).reduce((s, i) => s + (parseFloat(i.weight) || 0), 0);

  const setTierWeight = (rarityId: string, weight: string) => {
    setTiers((ts) => ts.map((t) => (t.rarity_id === rarityId ? { ...t, weight } : t)));
  };

  const addItem = (rarityId: string) => {
    setItemsByTier((m) => ({
      ...m,
      [rarityId]: [...(m[rarityId] ?? []), { chip_id: "", weight: "" }],
    }));
  };

  const setItem = (rarityId: string, idx: number, patch: Partial<ItemRow>) => {
    setItemsByTier((m) => ({
      ...m,
      [rarityId]: (m[rarityId] ?? []).map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const removeItem = (rarityId: string, idx: number) => {
    setItemsByTier((m) => ({
      ...m,
      [rarityId]: (m[rarityId] ?? []).filter((_, i) => i !== idx),
    }));
  };

  const publish = async () => {
    const tiersOut = tiers.map((t) => ({
      rarity: rarities.find((r) => r.id === t.rarity_id)?.slug ?? "",
      weight: Math.round((parseFloat(t.weight) || 0) * 10) / 10,
    }));
    const itemsOut: Array<Record<string, unknown>> = [];
    for (const t of tiers) {
      for (const it of itemsByTier[t.rarity_id] ?? []) {
        itemsOut.push({
          rarity: rarities.find((r) => r.id === t.rarity_id)?.slug ?? "",
          chip_id: it.chip_id || null,
          weight: Math.round((parseFloat(it.weight) || 0) * 10) / 10,
        });
      }
    }

    if (Math.round(tierWeightSum() * 10) / 10 !== 100) {
      toast("Сумма весов тиров должна быть ровно 100", "error");
      return;
    }
    for (const r of rarities) {
      const rows = itemsByTier[r.id] ?? [];
      if (rows.length > 0 && Math.round(itemsSum(r.id) * 10) / 10 !== 100) {
        toast(`Сумма весов фишек тира «${r.name}» должна быть 100`, "error");
        return;
      }
    }
    if (itemsOut.some((i) => !i.chip_id)) {
      toast("У каждой позиции должна быть выбрана фишка", "error");
      return;
    }

    setBusy(true);
    const res = await adminCreatePackVersion(packId, tiersOut, itemsOut);
    setBusy(false);
    if (res.ok) {
      toast("Версия создана и опубликована", "success");
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  const pretty = (v: unknown): string => {
    try {
      return JSON.stringify(v).replace(/},/g, "},\n");
    } catch {
      return String(v);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Panel>
          <PanelHeader title={`Редактор новой версии: ${packName}`} />
          <div className="flex flex-col gap-5 p-4">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
                Тиры (редкости) — сумма = 100
              </p>
              <div className="flex flex-col gap-2">
                {tiers.map((t) => {
                  const r = rarities.find((x) => x.id === t.rarity_id);
                  const sum = tierWeightSum();
                  return (
                    <div key={t.rarity_id} className="flex items-center gap-2">
                      <Badge>{r?.name ?? "?"}</Badge>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="вес"
                        value={t.weight}
                        onChange={(e) => setTierWeight(t.rarity_id, e.target.value)}
                        className="w-24"
                      />
                      <span className="text-[11px] text-ink-faint">
                        {((parseFloat(t.weight) || 0) / (sum || 1)) * 100 | 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p
                className={
                  tierWeightSum() === 100
                    ? "mt-2 text-[12px] font-semibold text-ok"
                    : "mt-2 text-[12px] text-ink-faint"
                }
              >
                Сумма: {Math.round(tierWeightSum() * 10) / 10} / 100
              </p>
            </div>

            {tiers.map((t) => {
              const r = rarities.find((x) => x.id === t.rarity_id);
              const rows = itemsByTier[t.rarity_id] ?? [];
              const sum = itemsSum(t.rarity_id);
              return (
                <div key={t.rarity_id}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
                      Фишки тира «{r?.name ?? "?"}» — сумма = 100
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => addItem(t.rarity_id)}>
                      <Plus className="h-3.5 w-3.5" />
                      Фишка
                    </Button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {rows.length === 0 && (
                      <p className="text-[11px] text-ink-dim">
                        Пусто — тир с нулевым весом или без фишек не попадёт в дроп
                      </p>
                    )}
                    {rows.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Select
                          className="flex-1"
                          value={it.chip_id}
                          onChange={(e) => setItem(t.rarity_id, idx, { chip_id: e.target.value })}
                        >
                          <option value="">—</option>
                          {chips
                            .filter((c) => c.rarity?.slug === r?.slug)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          placeholder="вес"
                          className="w-20"
                          value={it.weight}
                          onChange={(e) => setItem(t.rarity_id, idx, { weight: e.target.value })}
                        />
                        {sum !== 100 && rows.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(t.rarity_id, idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-danger" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {rows.length > 0 && (
                      <p className="text-[11px] text-ink-faint">
                        Сумма: {Math.round(sum * 10) / 10} / 100
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            <Button variant="primary" loading={busy} onClick={publish}>
              <Rocket className="h-4 w-4" />
              Создать версию
            </Button>
            <p className="text-[11px] text-ink-dim">
              При публикации вероятность мгновенно меняется для всех покупателей.
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="История версий" />
        <div className="flex max-h-[70vh] flex-col divide-y divide-panel-border overflow-y-auto">
          {versions.length === 0 ? (
            <p className="p-4 text-[12px] text-ink-faint">Версий пока нет</p>
          ) : (
            versions.map((v) => {
              const ver = v as {
                id: string;
                version: number;
                tiers: unknown;
                items: unknown;
                created_at: string;
              };
              return (
                <div key={ver.id} className="px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="info">v{ver.version}</Badge>
                    <span className="text-[11px] text-ink-faint">{ver.created_at}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-soft">
                    {pretty(ver.tiers)}
                    {"\n"}
                    {pretty(ver.items)}
                  </pre>
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
}
