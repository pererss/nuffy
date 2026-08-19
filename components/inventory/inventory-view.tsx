"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Search,
  ArrowUpRight,
  RefreshCw,
  Layers,
  X,
  Copy,
  Check,
  Grid2X2,
  Rows3,
} from "lucide-react";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge, LevelBadge, LockBadge, StatusPill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Field } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useSound } from "@/components/sound";
import { SellChipModal } from "@/components/chips/chip-actions";
import { createTrade } from "@/lib/actions/trades";
import { upgradeChip } from "@/lib/actions/upgrades";
import { cn, fmtPrice, fmtDate, sellCheck, lockInfo } from "@/lib/utils";
import type { ChipWithMeta, Collection, InventoryRow, Level, Rarity } from "@/lib/types";

export function InventoryView({
  items,
  rarities,
  levels,
  collections,
  allChips,
}: {
  items: InventoryRow[];
  rarities: Rarity[];
  levels: Level[];
  collections: Collection[];
  allChips: ChipWithMeta[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { play } = useSound();

  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState("");
  const [level, setLevel] = useState("");
  const [collection, setCollection] = useState("");
  const [sort, setSort] = useState("new");
  const [group, setGroup] = useState(false);
  const [compact, setCompact] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tradeOpen, setTradeOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    let list = items.filter((i) => i.status === "owned" || i.status === "listed");
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.chip_name.toLowerCase().includes(s) ||
          i.collection_name.toLowerCase().includes(s)
      );
    }
    if (rarity) list = list.filter((i) => i.rarity_slug === rarity);
    if (level) list = list.filter((i) => i.level_slug === level);
    if (collection) list = list.filter((i) => i.collection_id === collection);

    const sorts: Record<string, (a: InventoryRow, b: InventoryRow) => number> = {
      new: (a, b) => new Date(b.acquired_at).getTime() - new Date(a.acquired_at).getTime(),
      price_desc: (a, b) => b.base_price - a.base_price,
      price_asc: (a, b) => a.base_price - b.base_price,
      rarity: (a, b) => b.rarity_order - a.rarity_order,
      level: (a, b) => b.level_order - a.level_order,
      serial: (a, b) => a.chip_number - b.chip_number,
    };
    list = [...list].sort(sorts[sort] ?? sorts.new);
    return list;
  }, [items, q, rarity, level, collection, sort]);

  const groups = useMemo(() => {
    if (!group) return null;
    const map = new Map<string, InventoryRow[]>();
    filtered.forEach((i) => {
      const arr = map.get(i.collection_name) ?? [];
      arr.push(i);
      map.set(i.collection_name, arr);
    });
    return [...map.entries()];
  }, [filtered, group]);

  const selectedItems = items.filter((i) => selected.has(i.id));

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectableIds = filtered.filter((i) => i.status === "owned").map((i) => i.id);

  const renderCompactItem = (i: InventoryRow) => {
    const lock = lockInfo(i.locked_until);
    const sell = sellCheck(i);
    return (
      <div
        key={i.id}
        className={cn(
          "panel flex items-center gap-3 px-3 py-2 transition-all duration-150",
          selected.has(i.id) && "border-brand/50 shadow-glow"
        )}
      >
        <button
          onClick={() => toggle(i.id)}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
            selected.has(i.id)
              ? "border-brand bg-brand text-black"
              : "border-panel-strong bg-canvas-inset"
          )}
        >
          {selected.has(i.id) && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <ChipImage
          name={i.chip_name}
          imageUrl={i.image_url}
          crop={i.image_crop}
          rarity={i.rarity_slug}
          size={40}
        />
        <Link
          href={`/chips/${i.chip_id}`}
          className="flex min-w-0 flex-1 flex-col gap-0.5"
        >
          <span className="truncate text-[13px] font-semibold text-ink">{i.chip_name}</span>
          <span className="text-[11px] text-ink-faint">
            №{i.chip_number} · Экз. №{i.serial}
          </span>
        </Link>
        <div className="hidden items-center gap-1.5 md:flex">
          <RarityBadge slug={i.rarity_slug} name={i.rarity_name} />
          <LevelBadge level={i.level_name.replace("Level ", "L")} />
        </div>
        <LockBadge locked={lock.locked} />
        {i.status === "listed" && <StatusPill tone="info">ЛИСТИНГ</StatusPill>}
        <span className="tabular shrink-0 text-[13px] font-bold text-ink">
          {fmtPrice(i.base_price)}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={`/chips/${i.chip_id}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-panel-hover hover:text-ink"
            title="Открыть"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          {i.status === "owned" && (
            <SellChipModal
              instanceId={i.id}
              chipName={i.chip_name}
              locked={lock.locked}
              remainingText={lock.remainingText}
              collectionSoldOut={i.collection_status === "sold_out"}
              listed={false}
              trigger={(open) => (
                <button
                  onClick={open}
                  disabled={!sell.allowed}
                  className="flex h-7 items-center rounded-lg bg-ok/10 px-2 text-[11px] font-bold text-ok transition-colors hover:bg-ok/20 disabled:pointer-events-none disabled:opacity-40"
                  title={sell.allowed ? "Продать" : sell.reason === "lock" ? `Lock: ${lock.remainingText}` : "Коллекция не распродана"}
                >
                  SELL
                </button>
              )}
            />
          )}
        </div>
      </div>
    );
  };

  const renderItem = (i: InventoryRow) => {
    const lock = lockInfo(i.locked_until);
    const sell = sellCheck(i);
    return (
      <div
        key={i.id}
        className={cn(
          "panel group relative flex flex-col overflow-hidden transition-all duration-150",
          selected.has(i.id) && "border-brand/50 shadow-glow"
        )}
      >
        <button
          onClick={() => toggle(i.id)}
          className={cn(
            "absolute left-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded border transition-colors",
            selected.has(i.id)
              ? "border-brand bg-brand text-black"
              : "border-panel-strong bg-canvas-inset"
          )}
        >
          {selected.has(i.id) && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="black" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <Link
          href={`/chips/${i.chip_id}`}
          className="flex flex-col items-center gap-2.5 px-3 pb-2 pt-4"
        >
          <ChipImage
            name={i.chip_name}
            imageUrl={i.image_url}
            crop={i.image_crop}
            rarity={i.rarity_slug}
            size={72}
          />
          <div className="flex w-full flex-col items-center gap-0.5 text-center">
            <span className="truncate w-full text-[13px] font-semibold text-ink">
              {i.chip_name}
            </span>
            <span className="text-[11px] text-ink-faint">
              №{i.chip_number} · Экз. №{i.serial}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <RarityBadge slug={i.rarity_slug} name={i.rarity_name} />
            <LevelBadge level={i.level_name.replace("Level ", "L")} />
          </div>
        </Link>
        <div className="flex items-center justify-center gap-1.5 border-t border-panel-border px-3 py-2">
          <LockBadge locked={lock.locked} />
          {i.status === "listed" && <StatusPill tone="info">ЛИСТИНГ</StatusPill>}
        </div>
        <div className="flex items-center justify-between border-t border-panel-border px-3 py-2.5">
          <span className="tabular text-[13px] font-bold text-ink">
            {fmtPrice(i.base_price)}
          </span>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/chips/${i.chip_id}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-panel-hover hover:text-ink"
              title="Открыть"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            {i.status === "owned" && (
              <SellChipModal
                instanceId={i.id}
                chipName={i.chip_name}
                locked={lock.locked}
                remainingText={lock.remainingText}
                collectionSoldOut={i.collection_status === "sold_out"}
                listed={false}
                trigger={(open) => (
                  <button
                    onClick={open}
                    disabled={!sell.allowed}
                    className="flex h-7 items-center rounded-lg bg-ok/10 px-2 text-[11px] font-bold text-ok transition-colors hover:bg-ok/20 disabled:pointer-events-none disabled:opacity-40"
                    title={sell.allowed ? "Продать" : sell.reason === "lock" ? `Lock: ${lock.remainingText}` : "Коллекция не распродана"}
                  >
                    SELL
                  </button>
                )}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="panel mb-4 flex flex-col gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
            <Input
              className="pl-9"
              placeholder="Поиск в инвентаре…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select className="w-40" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Сначала новые</option>
            <option value="price_desc">Цена ↓</option>
            <option value="price_asc">Цена ↑</option>
            <option value="rarity">Редкость</option>
            <option value="level">Уровень</option>
            <option value="serial">Номер фишки</option>
          </Select>
          <Select className="w-40" value={rarity} onChange={(e) => setRarity(e.target.value)}>
            <option value="">Все редкости</option>
            {rarities.map((r) => (
              <option key={r.id} value={r.slug}>{r.name}</option>
            ))}
          </Select>
          <Select className="w-36" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Все уровни</option>
            {levels.map((l) => (
              <option key={l.id} value={l.slug}>{l.name}</option>
            ))}
          </Select>
          <Select className="w-44" value={collection} onChange={(e) => setCollection(e.target.value)}>
            <option value="">Все коллекции</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <button
            onClick={() => setGroup((v) => !v)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors",
              group ? "border-brand/50 text-brand" : "border-panel-border text-ink-soft hover:border-panel-strong"
            )}
          >
            <Layers className="h-4 w-4" />
            Группировка
          </button>
          <button
            onClick={() => setCompact((v) => !v)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors",
              compact ? "border-brand/50 text-brand" : "border-panel-border text-ink-soft hover:border-panel-strong"
            )}
            title={compact ? "Показать карточками" : "Показать списком"}
          >
            {compact ? <Grid2X2 className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
            {compact ? "Карточки" : "Список"}
          </button>
          <Link
            href="/trades"
            className="flex h-10 items-center gap-2 rounded-lg border border-panel-border px-3 text-[13px] font-medium text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
          >
            <RefreshCw className="h-4 w-4" />
            Обмены
          </Link>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-brand/30 bg-brand/10 px-3 py-2">
            <span className="text-[13px] font-semibold text-brand">
              Выбрано: {selected.size}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setTradeOpen(true)} disabled={!selectedItems.every((i) => i.status === "owned")}>
                <RefreshCw className="h-3.5 w-3.5" /> Обменять
              </Button>
              <Button size="sm" onClick={() => setUpgradeOpen(true)} disabled={!selectedItems.every((i) => i.status === "owned")}>
                <ArrowUpRight className="h-3.5 w-3.5" /> Апгрейд
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                <X className="h-3.5 w-3.5" /> Сбросить
              </Button>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Инвентарь пуст" : "Ничего не найдено"}
          description={
            items.length === 0
              ? "Купите фишку в магазине или откройте пак"
              : "Попробуйте изменить фильтры"
          }
          action={
            items.length === 0 ? (
              <Link href="/shop">
                <Button variant="primary">В магазин</Button>
              </Link>
            ) : undefined
          }
        />
      ) : groups ? (
        <div className="flex flex-col gap-6">
          {groups.map(([name, list]) => (
            <section key={name}>
              <h2 className="mb-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink-faint">
                {name} · {list.length}
              </h2>
              {compact ? (
                <div className="flex flex-col gap-2">{list.map(renderCompactItem)}</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {list.map(renderItem)}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : compact ? (
        <div className="flex flex-col gap-2">{filtered.map(renderCompactItem)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(renderItem)}
        </div>
      )}

      {tradeOpen && (
        <TradeOfferModal
          items={selectedItems}
          allChips={allChips}
          onClose={() => {
            setTradeOpen(false);
            setSelected(new Set());
          }}
          onDone={() => {
            setTradeOpen(false);
            setSelected(new Set());
            router.refresh();
          }}
        />
      )}

      {upgradeOpen && (
        <UpgradeModal
          items={selectedItems}
          allChips={allChips}
          onClose={() => {
            setUpgradeOpen(false);
            setSelected(new Set());
          }}
          onDone={() => {
            setUpgradeOpen(false);
            setSelected(new Set());
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function TradeOfferModal({
  items,
  allChips,
  onClose,
  onDone,
}: {
  items: InventoryRow[];
  allChips: ChipWithMeta[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const { play } = useSound();
  const [wantChipIds, setWantChipIds] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleWant = (id: string) => {
    setWantChipIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (wantChipIds.length === 0) {
      toast("Выберите, что вы хотите получить", "warning");
      return;
    }
    setLoading(true);
    const res = await createTrade(
      items.map((i) => i.id),
      wantChipIds,
      code.trim().toUpperCase()
    );
    setLoading(false);
    if (res.ok) {
      play("trade");
      setResult({ code: res.data!.code });
    } else {
      toast(res.error, "error");
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Новый обмен"
      size="lg"
      actions={
        result ? (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Закрыть
            </Button>
            <Button variant="primary" size="sm" onClick={onDone}>
              Готово
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button variant="primary" size="sm" loading={loading} onClick={submit}>
              Создать обмен
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-[13px] text-ink-soft">
            Обмен создан. Передайте код партнёру:
          </p>
          <button
            onClick={copy}
            className="flex items-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-6 py-3 font-mono text-2xl font-bold tracking-[0.2em] text-brand transition-colors hover:bg-brand/20"
          >
            {result.code}
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
          <p className="text-[12px] text-ink-faint">
            Принять: Торговая площадка → Обмены (или вкладка «Обмены» в
            инвентаре)
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="label-base mb-2">Вы отдаёте ({items.length})</p>
            <div className="flex flex-wrap gap-2">
              {items.map((i) => (
                <span key={i.id} className="flex items-center gap-1.5 rounded-lg border border-panel-border bg-canvas-inset px-2 py-1 text-[12px] text-ink-soft">
                  {i.chip_name} №{i.serial}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="label-base mb-2">Вы хотите получить (можно несколько фишек)</p>
            <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
              {allChips.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleWant(c.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors",
                    wantChipIds.includes(c.id)
                      ? "border-brand/50 bg-brand/10"
                      : "border-panel-border hover:border-panel-strong"
                  )}
                >
                  <ChipImage name={c.name} imageUrl={c.image_url} crop={c.image_crop} rarity={c.rarity.slug} size={28} ring={false} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium text-ink">{c.name}</span>
                    <span className="block text-[10px] text-ink-faint">{c.rarity.name} · {fmtPrice(c.base_price)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Field label="Свой код (необязательно)" hint="Оставьте пустым — код сгенерируется автоматически">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="До 8 символов"
              maxLength={8}
            />
          </Field>
          <p className="text-[11px] text-ink-dim">
            Lock переносится вместе с фишкой: новый владелец не получит
            возможность продать раньше оставшегося срока.
          </p>
        </div>
      )}
    </Modal>
  );
}

function UpgradeModal({
  items,
  allChips,
  onClose,
  onDone,
}: {
  items: InventoryRow[];
  allChips: ChipWithMeta[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const { play } = useSound();
  const [targetId, setTargetId] = useState("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);

  const sourceValue = items.reduce((s, i) => s + i.base_price, 0) * 0.9;
  const target = allChips.find((c) => c.id === targetId);
  const balanceNum = parseFloat(balance) || 0;
  const chance = target
    ? Math.max(1, Math.min(95, Math.round(((sourceValue + balanceNum) / target.base_price) * 100)))
    : 0;

  const submit = async () => {
    if (!targetId || items.length === 0) {
      toast("Выберите целевую фишку", "warning");
      return;
    }
    setLoading(true);
    const source = items[0];
    const res = await upgradeChip(source.id, targetId, balanceNum);
    setLoading(false);
    if (res.ok) {
      if (res.data!.success) {
        play("upgrade");
        toast(`Успех! Шанс был ${res.data!.chance}%`, "success");
      } else {
        play("error");
        toast(`Не повезло. Шанс был ${res.data!.chance}%`, "error");
      }
      onDone();
    } else {
      toast(res.error, "error");
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Апгрейд"
      size="lg"
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" size="sm" loading={loading} onClick={submit} disabled={!targetId}>
            Провести апгрейд
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-panel-border bg-canvas-inset p-3.5">
          <div>
            <p className="label-base mb-1">Вы сжигаете</p>
            <div className="flex flex-wrap gap-2">
              {items.map((i) => (
                <span key={i.id} className="text-[12px] text-ink-soft">
                  {i.chip_name} ({fmtPrice(i.base_price)})
                </span>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-ink-faint">
              В зачёт идёт {Math.round(sourceValue)} ₽ ({Math.round(items.length * 90)}%)
            </p>
          </div>
          <span className="font-display text-lg font-bold text-ink tabular">{Math.round(sourceValue)} ₽</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Целевая фишка">
            <Select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">Выберите…</option>
              {allChips
                .filter((c) => c.base_price > items[0]?.base_price)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.rarity.name} · {fmtPrice(c.base_price)}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Добавить из баланса, ₽">
            <Input
              type="number"
              min={0}
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-panel-border bg-canvas-inset p-3.5">
          <div className="flex flex-col gap-0.5 text-[12px]">
            <span className="text-ink-faint">
              Ценность залога: <b className="text-ink">{Math.round(sourceValue + balanceNum)} ₽</b>
            </span>
            <span className="text-ink-faint">
              Целевая стоимость: <b className="text-ink">{target ? Math.round(target.base_price) : "—"} ₽</b>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-ink-faint">Шанс</span>
            <span className="font-display text-2xl font-bold tabular text-brand">{chance}%</span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-ink-dim">
          Расчёт и результат определяются сервером. При неудаче фишка сгорает,
          добавленный баланс не возвращается.
        </p>
      </div>
    </Modal>
  );
}
