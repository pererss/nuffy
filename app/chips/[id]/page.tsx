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
    <div className="page-enter">
      <Link
        href="/shop"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-faint transition-colors hover:text-ink btn-press"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Магазин
      </Link>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* Left: chip + buy */}
        <div className="flex flex-col gap-4">
          {/* Main chip card */}
          <Panel className="flex flex-col items-center gap-3 p-5">
            <div
              className="relative flex w-full items-center justify-center rounded-[6px] py-3"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgb(var(--brand) / 0.12), rgb(var(--surface-2)) 70%)",
              }}
            >
              <div className="animate-pop-in">
                <ChipImage
                  name={chip.name}
                  imageUrl={chip.image_url}
                  crop={chip.image_crop}
                  rarity={chip.rarity.slug}
                  size={200}
                />
              </div>
            </div>
            <div className="text-center">
              <h1 className="font-display text-[17px] font-bold tracking-tight text-ink">
                {chip.name}
              </h1>
              <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                ID: {chip.id.slice(0, 8)} · №{chip.number} · {chip.collection.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RarityBadge slug={chip.rarity.slug} name={chip.rarity.name} />
              <LevelBadge level={chip.level.name.replace("Level ", "L")} />
            </div>
          </Panel>

          {/* Stats */}
          <Panel className="flex flex-col gap-0.5 p-3.5 text-[13px]">
            {[
              { label: "Первоначальная цена", value: fmtPrice(chip.base_price) },
              { label: "Текущая цена", value: fmtPrice(
                listingsRes.listings.length > 0
                  ? listingsRes.listings[0].price
                  : chip.base_price
              )},
              { label: "Тираж", value: fmtNumber(chip.total_minted) },
              { label: "Продано", value: fmtNumber(chip.sold_count) },
              { label: "Доступно", value: fmtNumber(stock) },
              { label: "Коллекция", value: collection?.status === "sold_out" ? "Распродана" : "В продаже" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-[rgb(var(--border))]/50 last:border-0">
                <span className="text-ink-faint">{row.label}</span>
                <span className="tabular font-medium text-ink">{row.value}</span>
              </div>
            ))}
          </Panel>

          {/* Buy button */}
          <BuyChipBig chipId={chip.id} stock={stock} price={chip.base_price} />

          {/* Actions */}
          <div className="flex gap-2">
            {user && <FavoriteButton chipId={chip.id} liked={favorites.has(chip.id)} />}
            <LinkToUpgrade href={`/upgrades?target=${chip.id}`} label="Апгрейд до" />
          </div>
        </div>

        {/* Right: instances + listings + history */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* My instances */}
          {user && myInstances.length > 0 && (
            <Panel>
              <PanelHeader title="Мои экземпляры" />
              <div className="flex flex-col divide-y divide-[rgb(var(--border))]">
                {myInstances.map((inst) => {
                  const lock = lockInfo(inst.locked_until);
                  const listed = listingsRes.listings.find(
                    (l) => l.instance_id === inst.id
                  );
                  const sellable =
                    !lock.locked && collection?.status === "sold_out" && !listed;
                  return (
                    <div key={inst.id} className="flex flex-col gap-2.5 p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">
                          Экземпляр №{inst.serial}
                        </span>
                        <LockBadge locked={lock.locked} />
                        {listed && <StatusPill tone="info">Выставлена</StatusPill>}
                      </div>
                      <div className="grid gap-x-5 gap-y-1 text-[12px] sm:grid-cols-2">
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

                      {/* Sell status box */}
                      <div className="flex flex-col gap-1 rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-2.5 text-[13px]">
                        {listed ? (
                          <p className="text-ink-soft">
                            Выставлена за <Price value={listed.price} size="sm" /> ·{" "}
                            <Link
                              href={`/marketplace/${listed.id}`}
                              className="text-brand hover:text-brand-hover"
                            >
                              открыть объявление
                            </Link>
                          </p>
                        ) : lock.locked ? (
                          <>
                            <p className="font-semibold text-warn">Продажа недоступна</p>
                            <p className="text-ink-soft">Фишка заблокирована</p>
                            <p className="text-[11px] text-ink-dim">Осталось: {lock.remainingText}</p>
                          </>
                        ) : collection?.status !== "sold_out" ? (
                          <>
                            <p className="font-semibold text-warn">Продажа недоступна</p>
                            <p className="text-ink-soft">Коллекция ещё не распродана</p>
                          </>
                        ) : (
                          <p className="font-semibold text-ok">Продажа доступна</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <SellChipModal
                          instanceId={inst.id}
                          chipName={chip.name}
                          locked={lock.locked}
                          remainingText={lock.remainingText}
                          collectionSoldOut={collection?.status === "sold_out"}
                          listed={Boolean(listed)}
                          trigger={(open) => (
                            <button
                              onClick={open}
                              className="inline-flex h-8 items-center rounded-[4px] bg-ok/10 px-3 text-[12px] font-semibold text-ok transition-colors hover:bg-ok/20 btn-press"
                            >
                              Продать
                            </button>
                          )}
                        />
                        <LinkToUpgrade
                          href={`/upgrades?source=${inst.id}`}
                          label="Апгрейд"
                        />
                        <Link
                          href={`/trades?source=${inst.id}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[rgb(var(--border))] px-3 text-[12px] font-medium text-ink-soft transition-colors hover:border-[rgb(var(--brand-border))] hover:text-brand btn-press"
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

          {/* Active listings */}
          <Panel>
            <PanelHeader title="Сейчас продаётся" />
            {listingsRes.listings.length === 0 ? (
              <p className="px-3.5 py-4 text-[13px] text-ink-faint">
                Объявлений пока нет — фишку можно купить в магазине.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-[rgb(var(--border))]">
                {listingsRes.listings.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 px-3.5 py-2.5"
                  >
                    <ChipImage
                      name={chip.name}
                      imageUrl={chip.image_url}
                      crop={chip.image_crop}
                      rarity={chip.rarity.slug}
                      size={40}
                      ring={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        {l.instance.chip.name} · №{l.instance.serial}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        @{userNameMap.get(l.seller_id)?.username ?? "—"} · {fmtDate(l.listed_at)}
                      </p>
                    </div>
                    <Price value={l.price} size="sm" />
                    <Link
                      href={`/marketplace/${l.id}`}
                      className="rounded-[4px] border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-colors hover:border-[rgb(var(--brand-border))] hover:text-brand btn-press"
                    >
                      Открыть
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Sales history */}
          <Panel>
            <PanelHeader
              title="История продаж"
              right={<ShoppingBag className="h-3.5 w-3.5 text-ink-dim" />}
            />
            {sales.length === 0 ? (
              <p className="px-3.5 py-4 text-[13px] text-ink-faint">
                Продаж пока не было.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-[rgb(var(--border))] text-[12px]">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-3.5 py-2">
                    <span className="w-28 shrink-0 text-ink-faint">{fmtDate(s.created_at)}</span>
                    <span className="flex-1 truncate text-ink-soft">
                      {s.seller_id
                        ? `@${userNameMap.get(s.seller_id)?.username ?? "—"}`
                        : "магазин"}{" "}
                      →{" "}
                      {s.buyer_id
                        ? `@${userNameMap.get(s.buyer_id)?.username ?? "—"}`
                        : "—"}
                    </span>
                    <span className="tabular font-semibold text-ink">{fmtPrice(s.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Ownership history */}
          <Panel>
            <PanelHeader
              title="История владельцев"
              right={<History className="h-3.5 w-3.5 text-ink-dim" />}
            />
            {events.length === 0 ? (
              <p className="px-3.5 py-4 text-[13px] text-ink-faint">
                История пуста.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {events.map((e, i) => (
                  <div
                    key={e.id}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2 text-[12px]",
                      i % 2 === 1 && "bg-[rgb(var(--surface-2))]/50"
                    )}
                  >
                    <span className="w-28 shrink-0 text-ink-faint">{fmtDate(e.created_at)}</span>
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
    case "minted": return "Выпуск";
    case "listed": return "Выставлена на площадке";
    case "unlisted": return "Снята с площадки";
    case "transfer": return meta?.via === "trade" ? "Обмен" : "Переход";
    case "upgrade_burned": return "Сожжена в апгрейде";
    default: return event;
  }
}