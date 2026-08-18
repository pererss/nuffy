import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge, LevelBadge } from "@/components/ui/badge";
import { Panel, PanelHeader, Price } from "@/components/ui/misc";
import { BuyListingButton } from "@/components/chips/chip-actions";
import { getListing, getUsernames } from "@/lib/data/chips";
import { createSupabase } from "@/lib/supabase/server";
import { fmtDate, fmtAccountId, fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing || listing.status !== "listed") notFound();

  const sb = await createSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const userMap = await getUsernames([listing.seller_id]);
  const seller = userMap.get(listing.seller_id);

  const chip = listing.instance.chip;
  const chipPageHref = `/chips/${chip.id}`;
  const isMine = user?.id === listing.seller_id;

  return (
    <div>
      <Link
        href="/marketplace"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-faint transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Торговая площадка
      </Link>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-4">
          <Panel className="flex flex-col items-center gap-4 p-6">
            <ChipImage
              name={chip.name}
              imageUrl={chip.image_url}
              crop={chip.image_crop}
              rarity={chip.rarity.slug}
              size={220}
            />
            <div className="text-center">
              <h1 className="font-display text-lg font-bold text-ink">
                {chip.name} · №{listing.instance.serial}
              </h1>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                {chip.collection.name} ·{" "}
                <Link href={chipPageHref} className="text-ink-soft underline decoration-panel-strong underline-offset-2 hover:text-brand">
                  страница фишки
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RarityBadge slug={chip.rarity.slug} />
              <LevelBadge level={chip.level.name} />
            </div>
          </Panel>

          <Panel className="flex flex-col gap-1 p-4 text-[13px]">
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Цена объявления</span>
              <Price value={listing.price} size="sm" />
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Базовая цена</span>
              <Price value={chip.base_price} size="sm" />
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Выставлено</span>
              <span className="text-ink">{fmtDate(listing.listed_at)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-faint">Экземпляр</span>
              <span className="text-ink">№{listing.instance.serial}</span>
            </div>
          </Panel>

          {isMine ? (
            <div className="flex flex-col gap-2 rounded-xl border border-info/40 bg-info/10 p-4 text-[13px] text-info">
              Это ваше объявление. После покупки средства поступят на баланс.
            </div>
          ) : (
            <BuyListingButton
              listingId={listing.id}
              price={listing.price}
              userId={user?.id ?? null}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel>
            <PanelHeader title="Продавец" />
            <Link
              href={`/users/${listing.seller_id}`}
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-panel-hover/60"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand/15 font-display text-base font-bold text-brand">
                {(seller?.username ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  @{seller?.username ?? "Пользователь удалён"}
                </p>
                <p className="text-[12px] text-ink-faint">
                  ID: {seller ? fmtAccountId(seller.accountId) : "—"}
                </p>
              </div>
              <ShieldCheck className="h-4 w-4 text-ok" />
            </Link>
          </Panel>

          <Panel>
            <PanelHeader title="О фишке" />
            <div className="flex flex-col gap-1 p-4 text-[13px]">
              <div className="flex justify-between py-1">
                <span className="text-ink-faint">Коллекция</span>
                <span className="text-ink">{chip.collection.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-faint">Тираж коллекции</span>
                <span className="tabular text-ink">{fmtNumber(chip.collection.total_minted)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-faint">Продано из тиража</span>
                <span className="tabular text-ink">{fmtNumber(chip.collection.sold_count)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-faint">Номер в коллекции</span>
                <span className="tabular text-ink">№{chip.number}</span>
              </div>
              <p className="mt-2 rounded-lg border border-panel-border bg-canvas-inset p-3 text-[12px] leading-relaxed text-ink-faint">
                После покупки фишка переходит новому владельцу с новым
                7-дневным lock. Продать её можно будет после истечения lock и
                полной распродажи коллекции.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
