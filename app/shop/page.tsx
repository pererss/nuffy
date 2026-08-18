import { Suspense } from "react";
import { Package } from "lucide-react";
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
      avail: (str("avail") || undefined) as "in_stock" | "sold_out" | undefined,
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
    <>
      <PageHeader
        title="Магазин"
        description={`${fmtNumber(shop.total)} фишек в каталоге · ${packs.length ? `${packs.length} пак(а) доступно` : "паков нет"}`}
      />

      <Suspense
        fallback={
          <div className="panel mb-5 h-[72px] animate-pulse rounded-panel" />
        }
      >
        <ShopFilters
          rarities={catalog.rarities}
          levels={catalog.levels}
          collections={catalog.collections}
        />
      </Suspense>

      {visiblePacks.length > 0 && (
        <Suspense
          fallback={
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1].map((i) => (
                <div key={i} className="panel h-64 animate-pulse" />
              ))}
            </div>
          }
        >
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
              <Package className="h-4 w-4 text-brand" />
              Паки
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePacks.map(({ pack, version, items }) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  version={version as NonNullable<typeof version>}
                  items={items ?? []}
                  userId={user?.id ?? null}
                />
              ))}
            </div>
          </section>
        </Suspense>
      )}

      <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Фишки</h2>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shop.chips.map((chip) => (
              <ChipCard
                key={chip.id}
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
            ))}
          </div>
        )}
      </Suspense>

      <Pagination pages={shop.pages} current={shop.page} />
    </>
  );
}
