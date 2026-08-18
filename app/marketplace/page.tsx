import { PageHeader, EmptyState, Price } from "@/components/ui/misc";
import { ChipCard, ChipCardPlaceholder } from "@/components/chips/chip-card";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import { Pagination } from "@/components/ui/pagination";
import { getCatalog, getListings, getUsernames } from "@/lib/data/chips";
import { fmtAccountId, fmtDate } from "@/lib/utils";
import type { ChipWithMeta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
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

  const [catalog, result] = await Promise.all([
    getCatalog(),
    getListings({
      q: str("q") || undefined,
      rarity: str("rarity") || undefined,
      collection: str("collection") || undefined,
      seller: str("seller") || undefined,
      priceMin: num("price_min"),
      priceMax: num("price_max"),
      sort: str("sort") || "new",
      page: num("page") ? Math.floor(num("page")!) : 1,
    }),
  ]);

  const userNameMap = await getUsernames(
    [...new Set(result.listings.map((l) => l.seller_id))]
  );

  return (
    <>
      <PageHeader
        title="Торговая площадка"
        description={`${result.total} активных объявлений от пользователей`}
      />

      <MarketplaceFilters
        rarities={catalog.rarities}
        collections={catalog.collections}
      />

      {result.listings.length === 0 ? (
        <EmptyState
          title="Объявлений пока нет"
          description="Продажа открывается после 7 дней с момента получения и полной распродажи коллекции"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {result.listings.map((l) => {
            const seller = userNameMap.get(l.seller_id);
            return (
              <ChipCard
                key={l.id}
                chip={
                  {
                    ...l.instance.chip,
                    collection_id: l.instance.chip.collection.id,
                    rarity_id: "",
                    level_id: "",
                    status: "active",
                    created_at: "",
                    collection: {
                      ...l.instance.chip.collection,
                      status: "active",
                    },
                  } as unknown as ChipWithMeta
                }
                href={`/marketplace/${l.id}`}
                price={<Price value={l.price} size="sm" />}
                sub={
                  <>
                    @{seller?.username ?? "—"} {seller ? `· ${fmtAccountId(seller.accountId)}` : ""}
                  </>
                }
                action={<span className="text-[11px] text-ink-faint">{fmtDate(l.listed_at)}</span>}
              />
            );
          })}
        </div>
      )}

      <Pagination pages={result.pages} current={result.page} />
    </>
  );
}