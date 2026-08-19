import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History, ShoppingBag, TrendingUp } from "lucide-react";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge, LevelBadge, LockBadge, StatusPill } from "@/components/ui/badge";
import { Panel, PanelHeader, Price, EmptyState } from "@/components/ui/misc";
import {
  FavoriteButton,
  BuyChipBig,
  SellChipModal,
  BuyListingButton,
  LinkToUpgrade,
} from "@/components/chips/chip-actions";
import {
  getChip,
  getMyInstancesOfChip,
  getFavorites,
  getListings,
  getChipSales,
  getChipEvents,
  getUsernames,
} from "@/lib/data/chips";
import { getCatalog } from "@/lib/data/chips";
import { createSupabase } from "@/lib/supabase/server";
import {
  fmtDate,
  fmtNumber,
  fmtPrice,
  lockInfo,
  cn,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const [chip, catalog, favorites, listingsRes] = await Promise.all([
    getChip(id),
    getCatalog(),
    user ? getFavorites(user.id) : Promise.resolve(new Set<string>()),
    getListings({ chipId: id, sort: "price_asc", pageSize: 30 }),
  ]);

  if (!chip) notFound();

  const myInstances = user ? await getMyInstancesOfChip(user.id, id) : [];
  const sales = await getChipSales(id, 20);
  const events = await getChipEvents(id, 40);

  const userNameIds = new Set<string>();
  listingsRes.listings.forEach((l) => userNameIds.add(l.seller_id));
  sales.forEach((s) => {
    if (s.buyer_id) userNameIds.add(s.buyer_id);
    if (s.seller_id) userNameIds.add(s.seller_id);
  });
  events.forEach((e) => {
    if (e.from_user_id) userNameIds.add(e.from_user_id);
    if (e.to_user_id) userNameIds.add(e.to_user_id);
  });
  const userNameMap = await getUsernames([...userNameIds]);

  const stock = chip.total_minted - chip.sold_count;
  const soldOut = chip.sold_count >= chip.total_minted;
  const collection = catalog.collections.find((c) => c.id === chip.collection_id);

  return (
    <div>
      <Link
        href="/shop"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-faint transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Магазин
      </Link>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* left: chip */}
        <div className="flex flex-col gap-4">
          <Panel className="flex flex-col items-center gap-4 p-6">
            <div
              className="relative flex w-full items-center justify-center rounded-xl py-2"
              style={{
                background:
                  "radial-gradient(circle at 50% 38%, rgb(var(--brand) / 0.16), rgb(var(--base-inset)) 68%)",
              }}
            >
              <div className="animate-pop-in">
                <ChipImage
                  name={chip.name}
                  imageUrl={chip.image_url}
                  crop={chip.image_crop}
                  rarity={chip.rarity.slug}
                  size={220}
                />
              </div>
            </div>
            <div className="text-center">
              <h1 className="font-display text-lg font-bold text-ink">
                {chip.name}
              </h1>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                ID: {chip.id.slice(0, 8)} · №{chip.number} ·{" "}
                {chip.collection.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RarityBadge slug={chip.rarity.slug} />
              <LevelBadge level={chip.level.name} />
            </div>
            <div className="flex items-center gap-2">
              {user && <FavoriteButton chipId={chip.id} liked={favorites.has(chip.id)} />}
              <LinkToUpgrade href={`/upgrades?target=${chip.id}`} label="Апгрейд до" />
            </div>
          </Panel>

          <Panel className="flex flex-col gap-1 p-4 text-[13px]">
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Первоначальная цена</span>
              <Price value={chip.base_price} size="sm" />
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Текущая цена</span>
              <Price
                value={
                  listingsRes.listings.length > 0
                    ? listingsRes.listings[0].price
                    : chip.base_price
                }
                size="sm"
              />
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Тираж</span>
              <span className="tabular text-ink">{fmtNumber(chip.total_minted)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Продано</span>
              <span className="tabular text-ink">{fmtNumber(chip.sold_count)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Доступно в магазине</span>
              <span className="tabular text-ink">{fmtNumber(stock)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Коллекция</span>
              <span className="text-ink">
                {collection?.status === "sold_out" ? "Распродана" : "В продаже"}
              </span>
            </div>
          </Panel>

          <BuyChipBig chipId={chip.id} stock={stock} price={chip.base_price} />
        </div>

        {/* right: instances + marketplace + history */}
        <div className="flex min-w-0 flex-col gap-6">
          {/* my instances */}
          {user && myInstances.length > 0 && (
            <Panel>
              <PanelHeader title="Мои экземпляры" />
              <div className="flex flex-col divide-y divide-panel-border">
                {myInstances.map((inst) => {
                  const lock = lockInfo(inst.locked_until);
                  const listed = listingsRes.listings.find(
                    (l) => l.instance_id === inst.id
                  );
                  const sellable =
                    !lock.locked && collection?.status === "sold_out" && !listed;
                  return (
                    <div key={inst.id} className="flex flex-col gap-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">
                          Экземпляр №{inst.serial}
                        </span>
                        <LockBadge locked={lock.locked} />
                        {listed && <StatusPill tone="info">Выставлена</StatusPill>}
                      </div>
                      <div className="grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-2">
                        <span className="text-ink-faint">
                          Получена: <span className="text-ink-soft">{fmtDate(inst.acquired_at)}</span>
                        </span>
                        <span className="text-ink-faint">
                          Способ: <span className="text-ink-soft">{inst.acquired_via}</span>
                        </span>
                        <span className="text-ink-faint">
                          Lock до: <span className="text-ink-soft">{fmtDate(inst.locked_until)}</span>
                        </span>
                        <span className="text-ink-faint">
                          Продажа:{" "}
                          <span className={sellable ? "text-ok" : "text-warn"}>
                            {sellable ? "доступна" : "недоступна"}
                          </span>
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 rounded-lg border border-panel-border bg-canvas-inset p-3 text-[13px]">
                        {listed ? (
                          <p className="text-ink-soft">
                            Выставлена на площадке за{" "}
                            <Price value={listed.price} size="sm" /> ·{" "}
                            <Link
                              href={`/marketplace/${listed.id}`}
                              className="text-brand hover:text-brand-hover"
                            >
                              открыть объявление
                            </Link>
                          </p>
                        ) : lock.locked ? (
                          <>
                            <p className="font-semibold text-warn">
                              Продажа недоступна
                            </p>
                            <p className="text-ink-soft">
                              Причина: фишка заблокирована
                            </p>
                            <p className="text-ink-faint">
                              Осталось: {lock.remainingText}
                            </p>
                            <p className="text-[11px] text-ink-dim">
                              Lock не снимается при распродаже коллекции: нужно
                              выполнить оба условия.
                            </p>
                          </>
                        ) : collection?.status !== "sold_out" ? (
                          <>
                            <p className="font-semibold text-warn">
                              Продажа недоступна
                            </p>
                            <p className="text-ink-soft">
                              Причина: коллекция ещё не распродана
                            </p>
                          </>
                        ) : (
                          <p className="font-semibold text-ok">
                            Продажа доступна
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <SellChipModal
                          instanceId={inst.id}
                          chipName={chip.name}
                          locked={lock.locked}
                          remainingText={lock.remainingText}
                          collectionSoldOut={collection?.status === "sold_out"}
                          listed={Boolean(listed)}
                          trigger={(open) => (
                            <ButtonSell onClick={open} />
                          )}
                        />
                        <LinkToUpgrade
                          href={`/upgrades?source=${inst.id}`}
                          label="Апгрейд"
                        />
                        <Link
                          href={`/trades?source=${inst.id}`}
                          className="inline-flex h-10 items-center gap-2 rounded-lg border border-panel-border px-4 text-sm font-medium text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
                        >
                          Обменять
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* active listings */}
          <Panel>
            <PanelHeader title="Сейчас продаётся" />
            {listingsRes.listings.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-ink-faint">
                Объявлений пока нет — фишку можно купить в магазине.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-panel-border">
                {listingsRes.listings.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <ChipImage
                      name={chip.name}
                      imageUrl={chip.image_url}
                      crop={chip.image_crop}
                      rarity={chip.rarity.slug}
                      size={44}
                      ring={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        {l.instance.chip.name} · №{l.instance.serial}
                      </p>
                      <p className="text-[12px] text-ink-faint">
                        Продавец @{userNameMap.get(l.seller_id)?.username ?? "—"} ·{" "}
                        {fmtDate(l.listed_at)}
                      </p>
                    </div>
                    <Price value={l.price} size="sm" />
                    <Link
                      href={`/marketplace/${l.id}`}
                      className="rounded-lg border border-panel-border px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
                    >
                      Открыть
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* sales history */}
          <Panel>
            <PanelHeader
              title="История продаж"
              right={<ShoppingBag className="h-4 w-4 text-ink-dim" />}
            />
            {sales.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-ink-faint">
                Продаж пока не было.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-panel-border text-[12px]">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-28 shrink-0 text-ink-faint">
                      {fmtDate(s.created_at)}
                    </span>
                    <span className="flex-1 truncate text-ink-soft">
                      {s.seller_id
                        ? `@${userNameMap.get(s.seller_id)?.username ?? "—"}`
                        : "магазин"}{" "}
                      →{" "}
                      {s.buyer_id
                        ? `@${userNameMap.get(s.buyer_id)?.username ?? "—"}`
                        : "—"}
                    </span>
                    <span className="tabular font-semibold text-ink">
                      {fmtPrice(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* ownership history */}
          <Panel>
            <PanelHeader
              title="История владельцев"
              right={<History className="h-4 w-4 text-ink-dim" />}
            />
            {events.length === 0 ? (
              <p className="px-4 py-5 text-[13px] text-ink-faint">
                История пуста.
              </p>
            ) : (
              <div className="flex max-h-72 flex-col gap-0 overflow-y-auto">
                {events.map((e, i) => (
                  <div
                    key={e.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 text-[12px]",
                      i % 2 === 1 && "bg-canvas-inset/60"
                    )}
                  >
                    <span className="w-28 shrink-0 text-ink-faint">
                      {fmtDate(e.created_at)}
                    </span>
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-ink-dim" />
                    <span className="truncate text-ink-soft">
                      {eventLabel(e.event, e.meta)} —{" "}
                      {e.from_user_id
                        ? `@${userNameMap.get(e.from_user_id)?.username ?? "—"}`
                        : "NUFFY"}{" "}
                      →{" "}
                      {e.to_user_id
                        ? `@${userNameMap.get(e.to_user_id)?.username ?? "—"}`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function eventLabel(
  event: string,
  meta: Record<string, unknown> | null
): string {
  switch (event) {
    case "minted":
      return "Выпуск";
    case "listed":
      return "Выставлена на площадке";
    case "unlisted":
      return "Снята с площадки";
    case "transfer":
      return meta?.via === "trade" ? "Обмен" : "Переход";
    case "upgrade_burned":
      return "Сожжена в апгрейде";
    default:
      return event;
  }
}

function ButtonSell({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-10 items-center rounded-lg bg-ok/10 px-4 text-sm font-semibold text-ok transition-colors hover:bg-ok/20"
    >
      Продать
    </button>
  );
}
