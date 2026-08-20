import Link from "next/link";
import { Suspense } from "react";
import { Package, TrendingUp, Sparkles } from "lucide-react";
import { PageHeader, EmptyState, Price } from "@/components/ui/misc";
import { ShopFilters } from "@/components/shop/shop-filters";
import { ChipCard, ChipCardPlaceholder } from "@/components/chips/chip-card";
import { PackCard } from "@/components/shop/pack-card";
import { BuyChipButton } from "@/components/shop/buy-button";
import { Pagination } from "@/components/ui/pagination";
import { getShopChips, getActivePacks, getCatalog, getPack } from "@/lib/data/chips";
import { createSupabase } from "@/lib/supabase/server";
import { fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const featuredCollections = [
  { name: "URBAN SHADOWS", tag: "НОВАЯ КОЛЛЕКЦИЯ", desc: "Ограниченная серия коллекционных фишек. Только 1000 экземпляров.", color: "from-brand/20 via-brand/10 to-transparent" },
  { name: "CYBER GARDEN", tag: "ПОПУЛЯРНОЕ", desc: "Футуристические цифровые фишки с уникальным дизайном.", color: "from-rarity-epic/20 via-rarity-epic/10 to-transparent" },
  { name: "DIGITAL LIFE", tag: "ЭКСКЛЮЗИВ", desc: "Коллекция с максимальным тиражом и редкими уровнями.", color: "from-rarity-legendary/20 via-rarity-legendary/10 to-transparent" },
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const str = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };
  const num = (k: string) => {
    const v = parseFloat(str(k));
    return Number.isFinite(v) ? v : undefined;
  };

  const [sb, catalog, packs, shop] = await Promise.all([
    createSupabase(),
    getCatalog(),
    getActivePacks(),
    getShopChips({
      q: str("q") || undefined,
      collection: str("collection") || undefined,
      rarity: str("rarity") || undefined,
      level: str("level") || undefined,
      priceMin: num("price_min"),
      priceMax: num("price_max"),
      avail: (str("avail") || "in_stock") as "in_stock" | "sold_out" | undefined,
      sort: (str("sort") || undefined) as
        | "popular"
        | "price_asc"
        | "price_desc"
        | "new"
        | "rarity"
        | "edition"
        | "remaining"
        | undefined,
      page: num("page") ? Math.floor(num("page")!) : 1,
    }),
  ]);

  const {
    data: { user },
  } = await sb.auth.getUser();

  const packData = await Promise.all(
    packs.map(async (p) => ({
      pack: p,
      ...(await getPack(p.id)),
    }))
  );

  const visiblePacks = packData.filter((pd) => pd.version !== null);

  return (
    <div className="page-enter">
      {/* Featured Banner */}
      <div className="panel-accent mb-4 overflow-hidden">
        <div className="relative bg-[rgb(var(--surface-2))] p-5 sm:p-6 lg:p-7">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-brand/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(160,110,255,0.1),transparent_50%)]" />

          {/* Grid decoration */}
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />

          {/* Corner marks */}
          <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-brand/40" />
          <div className="pointer-events-none absolute right-3 bottom-3 h-3 w-3 border-r border-b border-brand/40" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <span className="tech-label mb-2 block text-brand">
                {featuredCollections[0].tag}
              </span>
              <h2 className="font-display text-xl font-bold tracking-[0.1em] text-ink sm:text-2xl lg:text-3xl">
                {featuredCollections[0].name}
              </h2>
              <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">
                {featuredCollections[0].desc}
              </p>
              <Link href="/shop?rarity=legendary" className="mt-4 inline-flex h-9 items-center gap-2 rounded-[4px] bg-brand px-4 text-[13px] font-bold text-[#0a0a12] transition-all hover:bg-brand-hover btn-press">
                К покупкам
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Decorative chip placeholder */}
            <div className="hidden shrink-0 lg:flex">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 flex items-center justify-center animate-float">
                  <Sparkles className="h-10 w-10 text-brand/60" />
                </div>
                <div className="absolute -inset-2 rounded-full border border-brand/10 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Collection indicators */}
          <div className="relative mt-4 flex items-center gap-2">
            {featuredCollections.map((c, i) => (
              <button
                key={c.name}
                className="h-1 flex-1 rounded-full bg-brand/40 transition-all hover:bg-brand/60"
              />
            ))}
          </div>
        </div>
      </div>

      <PageHeader
        title="Магазин"
        description={`${fmtNumber(shop.total)} фишек в каталоге · ${packs.length ? `${packs.length} пак(а) доступно` : "паков нет"}`}
      />

      <Suspense
        fallback={
          <div className="panel mb-4 h-[56px] skeleton" />
        }
      >
        <ShopFilters
          rarities={catalog.rarities}
          levels={catalog.levels}
          collections={catalog.collections}
        />
      </Suspense>

      {/* Packs section */}
      {visiblePacks.length > 0 && (
        <Suspense
          fallback={
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1].map((i) => (
                <div key={i} className="panel h-56 skeleton" />
              ))}
            </div>
          }
        >
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-[13px] font-bold tracking-[0.08em] text-ink">
              <Package className="h-3.5 w-3.5 text-brand" />
              ПАКИ
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePacks.map(({ pack, version, items }, i) => (
                <div
                  key={pack.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <PackCard
                    pack={pack}
                    version={version as NonNullable<typeof version>}
                    items={items ?? []}
                    userId={user?.id ?? null}
                  />
                </div>
              ))}
            </div>
          </section>
        </Suspense>
      )}

      {/* Popular chips */}
      <h2 className="mb-3 flex items-center gap-2 font-display text-[13px] font-bold tracking-[0.08em] text-ink">
        <TrendingUp className="h-3.5 w-3.5 text-brand" />
        ПОПУЛЯРНОЕ
        <span className="ml-1 font-mono text-[10px] text-ink-dim">
          {shop.total}
        </span>
      </h2>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <ChipCardPlaceholder key={i} />
            ))}
          </div>
        }
      >
        {shop.chips.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            description="Попробуйте изменить фильтры или запрос"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shop.chips.map((chip, i) => (
              <div
                key={chip.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 14) * 45}ms` }}
              >
                <ChipCard
                  chip={chip}
                  href={`/chips/${chip.id}`}
                  price={
                    <Price value={chip.base_price} size="sm" />
                  }
                  sub={
                    chip.sold_count >= chip.total_minted
                      ? "Распродано"
                      : `Осталось: ${fmtNumber(chip.total_minted - chip.sold_count)}`
                  }
                  action={
                    <BuyChipButton
                      chipId={chip.id}
                      userId={user?.id ?? null}
                      stock={chip.total_minted - chip.sold_count}
                    />
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Suspense>

      <Pagination pages={shop.pages} current={shop.page} />
    </div>
  );
}