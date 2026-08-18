"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input, Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { Collection, Level, Rarity } from "@/lib/types";

const SORTS: Array<{ value: string; label: string }> = [
  { value: "popular", label: "Популярность" },
  { value: "price_asc", label: "Цена ↑" },
  { value: "price_desc", label: "Цена ↓" },
  { value: "new", label: "Сначала новые" },
  { value: "rarity", label: "Редкость" },
  { value: "edition", label: "Тираж" },
  { value: "remaining", label: "Осталось меньше" },
];

export function ShopFilters({
  rarities,
  levels,
  collections,
}: {
  rarities: Rarity[];
  levels: Level[];
  collections: Collection[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "popular");
  const [collection, setCollection] = useState(params.get("collection") ?? "");
  const [rarity, setRarity] = useState(params.get("rarity") ?? "");
  const [level, setLevel] = useState(params.get("level") ?? "");
  const [avail, setAvail] = useState(params.get("avail") ?? "");
  const [priceMin, setPriceMin] = useState(params.get("price_min") ?? "");
  const [priceMax, setPriceMax] = useState(params.get("price_max") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setSort(params.get("sort") ?? "popular");
    setCollection(params.get("collection") ?? "");
    setRarity(params.get("rarity") ?? "");
    setLevel(params.get("level") ?? "");
    setAvail(params.get("avail") ?? "");
    setPriceMin(params.get("price_min") ?? "");
    setPriceMax(params.get("price_max") ?? "");
  }, [params]);

  const apply = () => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (sort !== "popular") sp.set("sort", sort);
    if (collection) sp.set("collection", collection);
    if (rarity) sp.set("rarity", rarity);
    if (level) sp.set("level", level);
    if (avail) sp.set("avail", avail);
    if (priceMin) sp.set("price_min", priceMin);
    if (priceMax) sp.set("price_max", priceMax);
    sp.set("page", "1");
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <div className="panel mb-5 flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
          <Input
            className="pl-9"
            placeholder="Поиск фишек…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        </div>
        <Select
          className="w-44"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            const sp = new URLSearchParams(params.toString());
            e.target.value === "popular"
              ? sp.delete("sort")
              : sp.set("sort", e.target.value);
            sp.set("page", "1");
            router.push(`${pathname}?${sp}`);
          }}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors",
            filtersOpen
              ? "border-brand/50 text-brand"
              : "border-panel-border text-ink-soft hover:border-panel-strong"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Фильтры</span>
        </button>
        <button
          onClick={apply}
          className="h-10 rounded-lg bg-brand px-4 text-[13px] font-semibold text-black transition-colors hover:bg-brand-hover"
        >
          Найти
        </button>
      </div>

      {filtersOpen && (
        <div className="grid grid-cols-2 gap-3 border-t border-panel-border pt-3 sm:grid-cols-3 lg:grid-cols-6">
          <Select
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          >
            <option value="">Все коллекции</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={rarity} onChange={(e) => setRarity(e.target.value)}>
            <option value="">Все редкости</option>
            {rarities.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.name}
              </option>
            ))}
          </Select>
          <Select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Все уровни</option>
            {levels.map((l) => (
              <option key={l.id} value={l.slug}>
                {l.name}
              </option>
            ))}
          </Select>
          <Select value={avail} onChange={(e) => setAvail(e.target.value)}>
            <option value="">Любая доступность</option>
            <option value="in_stock">В наличии</option>
            <option value="sold_out">Распродано</option>
          </Select>
          <Input
            type="number"
            min={0}
            placeholder="Цена от"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <Input
            type="number"
            min={0}
            placeholder="Цена до"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
