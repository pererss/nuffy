"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Flame } from "lucide-react";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select, Field, Input } from "@/components/ui/form";
import { Panel, PanelHeader, EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { upgradeChip } from "@/lib/actions/upgrades";
import { fmtDate, fmtPrice, fmtNumber, cn } from "@/lib/utils";
import type { ChipWithMeta, InventoryRow } from "@/lib/types";

export function UpgradesView({
  owned,
  allChips,
  history,
}: {
  owned: InventoryRow[];
  allChips: ChipWithMeta[];
  history: Array<{
    id: string;
    balance_spent: number;
    chance: number;
    created_at: string;
    target: { name: string; number: number; rarity: { slug: string; name: string; color: string } } | null;
    attempt: Array<{ success: boolean; result_instance_id: string | null }>;
  }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [sourceId, setSourceId] = useState(searchParams.get("source") ?? "");
  const [targetId, setTargetId] = useState(searchParams.get("target") ?? "");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    chance: number;
  } | null>(null);

  useEffect(() => {
    const s = searchParams.get("source");
    const t = searchParams.get("target");
    if (s) setSourceId(s);
    if (t) setTargetId(t);
  }, [searchParams]);

  const source = owned.find((i) => i.id === sourceId);
  const target = allChips.find((c) => c.id === targetId);
  const balanceNum = parseFloat(balance) || 0;

  const sourceValue = source ? source.base_price * 0.9 : 0;
  const chance = useMemo(() => {
    if (!target) return 0;
    const ratio = (sourceValue + balanceNum) / target.base_price;
    return Math.max(1, Math.min(95, Math.round(ratio * 100)));
  }, [target, sourceValue, balanceNum]);

  const roll = async () => {
    if (!source || !target) {
      toast("Выберите фишку и цель", "warning");
      return;
    }
    setLoading(true);
    const res = await upgradeChip(source.id, target.id, balanceNum);
    setLoading(false);
    if (res.ok) {
      setResult({ success: res.data!.success, chance: res.data!.chance });
      toast(
        res.data!.success
          ? `Успех! Шанс был ${res.data!.chance}%`
          : `Не повезло. Шанс был ${res.data!.chance}%`,
        res.data!.success ? "success" : "error"
      );
      router.refresh();
    } else {
      toast(res.error, "error");
    }
  };

  return (
    <div className="page-enter">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Main upgrade panel */}
        <div className="flex flex-col gap-4">
          <Panel className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-[13px] font-bold tracking-[0.08em] text-ink">
              <Flame className="h-4 w-4 text-brand" />
              АПГРЕЙД
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Фишка (сгорит)">
                <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                  <option value="">Выберите…</option>
                  {owned.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.chip_name} №{i.serial} · {fmtPrice(i.base_price)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Целевая фишка">
                <Select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                  <option value="">Выберите…</option>
                  {allChips
                    .filter((c) => c.base_price > (source?.base_price ?? 0))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.rarity.name} · {fmtPrice(c.base_price)}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Добавить из баланса, ₽" hint="Увеличивает шанс, сгорает при неудаче">
                <Input
                  type="number"
                  min={0}
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </Field>
              <div className="flex flex-col justify-end gap-1">
                <div className="flex items-end justify-between rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2">
                  <span className="text-[11px] text-ink-faint">Шанс</span>
                  <span className="font-display text-3xl font-bold tabular text-brand">{chance}%</span>
                </div>
              </div>
            </div>

            {/* Summary bar */}
            <div className="mt-4 flex items-center justify-between rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2.5 text-[13px]">
              <span className="text-ink-faint">
                Залог: <b className="text-ink">{Math.round(sourceValue)} ₽</b>
                {balanceNum > 0 && <span className="text-ink-soft"> + {Math.round(balanceNum)} ₽</span>}
              </span>
              <span className="text-ink-faint">
                Цель: <b className="text-ink">{target ? Math.round(target.base_price) : "—"} ₽</b>
              </span>
            </div>

            {/* Visual: source → target */}
            {source && target && (
              <div className="mt-4 flex items-center justify-center gap-4 rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                <div className="flex flex-col items-center gap-1.5">
                  <ChipImage
                    name={source.chip_name}
                    imageUrl={source.image_url}
                    crop={source.image_crop}
                    rarity={source.rarity_slug}
                    size={56}
                  />
                  <span className="truncate max-w-[80px] text-[10px] text-ink-faint">{source.chip_name}</span>
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-brand" />
                <div className="flex flex-col items-center gap-1.5">
                  <ChipImage
                    name={target.name}
                    imageUrl={target.image_url}
                    crop={target.image_crop}
                    rarity={target.rarity.slug}
                    size={56}
                  />
                  <span className="truncate max-w-[80px] text-[10px] text-ink-faint">{target.name}</span>
                </div>
              </div>
            )}

            <Button
              className="mt-4 w-full justify-center"
              variant="primary"
              size="lg"
              loading={loading}
              onClick={roll}
              disabled={!source || !target}
            >
              <Flame className="h-4 w-4" />
              Провести апгрейд
            </Button>
            <p className="mt-1.5 text-[10px] text-ink-dim text-center">
              Апгрейд разрешён даже во время lock. Результат считается на сервере.
            </p>
          </Panel>

          {/* Value comparison */}
          {source && target && (
            <Panel className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <ChipImage
                  name={source.chip_name}
                  imageUrl={source.image_url}
                  crop={source.image_crop}
                  rarity={source.rarity_slug}
                  size={48}
                />
                <ArrowUpRight className="h-4 w-4 text-brand" />
                <ChipImage
                  name={target.name}
                  imageUrl={target.image_url}
                  crop={target.image_crop}
                  rarity={target.rarity.slug}
                  size={48}
                />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-ink-faint">Ценность залога</p>
                <p className="font-display text-lg font-bold tabular text-ink">
                  {fmtNumber(Math.round(sourceValue + balanceNum))} ₽
                </p>
                <p className="text-[10px] text-ink-faint">из {fmtNumber(Math.round(target.base_price))} ₽</p>
              </div>
            </Panel>
          )}
        </div>

        {/* Sidebar: history */}
        <Panel>
          <PanelHeader title="История" />
          {history.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Пока пусто" description="Попытки апгрейда появятся здесь" />
            </div>
          ) : (
            <div className="flex max-h-[500px] flex-col divide-y divide-[rgb(var(--border))] overflow-y-auto">
              {history.map((h) => {
                const ok = h.attempt[0]?.success;
                return (
                  <div key={h.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] text-[11px] font-bold",
                        ok ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"
                      )}
                    >
                      {ok ? "✓" : "✕"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ink">
                        {h.target?.name ?? "—"}
                        {h.target?.rarity && <RarityBadge slug={h.target.rarity.slug} className="ml-1.5" />}
                      </p>
                      <p className="text-[10px] text-ink-faint">
                        {fmtDate(h.created_at)} · шанс {h.chance}%
                      </p>
                    </div>
                    {h.balance_spent > 0 && (
                      <span className="shrink-0 tabular text-[10px] text-ink-faint">
                        +{fmtNumber(Math.round(h.balance_spent))} ₽
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Result modal */}
      <Modal
        open={result !== null}
        onClose={() => setResult(null)}
        title={result?.success ? "Успех!" : "Неудача"}
        size="sm"
        actions={
          <Button variant="primary" size="sm" onClick={() => setResult(null)}>
            Закрыть
          </Button>
        }
      >
        {result && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full font-display text-2xl font-bold",
                result.success ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"
              )}
            >
              {result.success ? "✓" : "✕"}
            </span>
            <p className="text-[13px] font-semibold text-ink">
              {result.success
                ? "Апгрейд удался — новая фишка в инвентаре (новый 7-дневный lock)"
                : "Фишка сгорела. Попробуйте ещё раз"}
            </p>
            <p className="text-[11px] text-ink-faint">Шанс был {result.chance}%</p>
          </div>
        )}
      </Modal>
    </div>
  );
}