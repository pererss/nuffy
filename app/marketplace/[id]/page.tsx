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
    <div className="page-enter">
      <Link
        href="/marketplace"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-faint transition-colors hover:text-ink btn-press"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Торговая площадка
      </Link>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Left: chip + buy */}
        <div className="flex flex-col gap-4">
          <Panel className="flex flex-col items-center gap-3 p-5">
            <div
              className="relative flex w-full items-center justify-center rounded-[6px] py-3"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgb(var(--brand) / 0.1), rgb(var(--surface-2)) 70%)",
              }}
            >
              <ChipImage
                name={chip.name}
                imageUrl={chip.image_url}
                crop={chip.image_crop}
                rarity={chip.rarity.slug}
                size={200}
              />
            </div>
            <div className="text-center">
              <h1 className="font-display text-[17px] font-bold tracking-tight text-ink">
                {chip.name} · №{listing.instance.serial}
              </h1>
              <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                {chip.collection.name} ·{" "}
                <Link href={chipPageHref} className="text-ink-soft underline decoration-[rgb(var(--border))] underline-offset-2 hover:text-brand">
                  страница фишки
                </Link>
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
              { label: "Цена объявления", value: `${fmtNumber(listing.price)} ₽` },
              { label: "Базовая цена", value: `${fmtNumber(chip.base_price)} ₽` },
              { label: "Выставлено", value: fmtDate(listing.listed_at) },
              { label: "Экземпляр", value: `№${listing.instance.serial}` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-[rgb(var(--border))]/50 last:border-0">
                <span className="text-ink-faint">{row.label}</span>
                <span className="tabular font-medium text-ink">{row.value}</span>
              </div>
            ))}
          </Panel>

          {isMine ? (
            <div className="flex flex-col gap-1.5 rounded-[4px] border border-info/30 bg-info/8 p-3 text-[13px] text-info">
              <p className="font-semibold">Это ваше объявление</p>
              <p className="text-ink-soft">После покупки средства поступят на баланс.</p>
            </div>
          ) : (
            <BuyListingButton
              listingId={listing.id}
              price={listing.price}
              userId={user?.id ?? null}
            />
          )}
        </div>

        {/* Right: seller + chip info */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Seller */}
          <Panel>
            <PanelHeader title="Продавец" />
            <Link
              href={`/users/${listing.seller_id}`}
              className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[rgb(var(--surface-hover))]/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-brand/15 font-display text-sm font-bold text-brand">
                {(seller?.username ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">
                  @{seller?.username ?? "Пользователь удалён"}
                </p>
                <p className="text-[11px] text-ink-faint">
                  ID: {seller ? fmtAccountId(seller.accountId) : "—"}
                </p>
              </div>
              <ShieldCheck className="h-4 w-4 shrink-0 text-ok" />
            </Link>
          </Panel>

          {/* Chip info */}
          <Panel>
            <PanelHeader title="О фишке" />
            <div className="flex flex-col gap-0.5 p-3.5 text-[13px]">
              {[
                { label: "Коллекция", value: chip.collection.name },
                { label: "Тираж", value: fmtNumber(chip.collection.total_minted) },
                { label: "Продано", value: fmtNumber(chip.collection.sold_count) },
                { label: "Номер", value: `№${chip.number}` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-[rgb(var(--border))]/50 last:border-0">
                  <span className="text-ink-faint">{row.label}</span>
                  <span className="tabular font-medium text-ink">{row.value}</span>
                </div>
              ))}
              <p className="mt-2 rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-2.5 text-[11px] leading-relaxed text-ink-faint">
                После покупки фишка переходит новому владельцу с новым
                7-дневным lock. Продать можно после истечения lock и полной
                распродажи коллекции.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}