"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/form";
import type { Collection, Rarity } from "@/lib/types";

const SORTS: Array<{ value: string; label: string }> = [
  { value: "new", label: "Сначала новые" },
  { value: "price_asc", label: "Цена ↑" },
  { value: "price_desc", label: "Цена ↓" },
  { value: "rarity", label: "Редкость" },
  { value: "level", label: "Уровень" },
];

export function MarketplaceFilters({
  rarities,
  collections,
}: {
  rarities: Rarity[];
  collections: Collection[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "new");
  const [rarity, setRarity] = useState(params.get("rarity") ?? "");
  const [collection, setCollection] = useState(params.get("collection") ?? "");
  const [seller, setSeller] = useState(params.get("seller") ?? "");
  const [priceMin, setPriceMin] = useState(params.get("price_min") ?? "");
  const [priceMax, setPriceMax] = useState(params.get("price_max") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setSort(params.get("sort") ?? "new");
    setRarity(params.get("rarity") ?? "");
    setCollection(params.get("collection") ?? "");
    setSeller(params.get("seller") ?? "");
    setPriceMin(params.get("price_min") ?? "");
    setPriceMax(params.get("price_max") ?? "");
  }, [params]);

  const push = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    Object.entries(patch).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    const keep = ["q", "sort", "rarity", "collection", "seller", "price_min", "price_max"];
    keep.forEach((k) => {
      if (!(k in patch)) {
        const v = params.get(k);
        if (v) sp.set(k, v);
      }
    });
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <div className="panel mb-4 flex flex-col gap-2.5 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-dim" />
          <Input
            className="pl-8 h-9 text-[13px]"
            placeholder="Поиск фишек…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && push({ q: q.trim() })}
          />
        </div>
        <Select
          className="h-9 text-[13px]"
          value={sort}
          onChange={(e) => push({ sort: e.target.value })}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select
          className="h-9 text-[13px]"
          value={rarity}
          onChange={(e) => push({ rarity: e.target.value })}
        >
          <option value="">Все редкости</option>
          {rarities.map((r) => (
            <option key={r.id} value={r.slug}>{r.name}</option>
          ))}
        </Select>
        <Select
          className="h-9 text-[13px]"
          value={collection}
          onChange={(e) => push({ collection: e.target.value })}
        >
          <option value="">Все коллекции</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input
          placeholder="Продавец"
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && push({ seller: seller.trim() })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Цена от, ₽"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && push({ price_min: priceMin })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Цена до, ₽"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && push({ price_max: priceMax })}
        />
      </div>
    </div>
  );
}