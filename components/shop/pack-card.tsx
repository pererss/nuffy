"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useSound } from "@/components/sound";
import { openPack, type ChipActionResult } from "@/lib/actions/shop";
import { fmtPrice } from "@/lib/utils";
import type { Pack, PackItem, PackVersion } from "@/lib/types";

export function PackCard({
  pack,
  version,
  items,
  userId,
}: {
  pack: Pack;
  version: PackVersion | null;
  items: PackItem[];
  userId: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="panel group relative flex flex-col overflow-hidden text-left card-lift"
      >
        <div className="relative h-32 overflow-hidden bg-[rgb(var(--surface-2))]">
          {pack.image_url ? (
            <img src={pack.image_url} alt={pack.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--surface-3))] to-[rgb(var(--surface-2))]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(160,110,255,0.08),transparent_60%)]" />
            </span>
          )}
          <span className="tech-label absolute left-2.5 top-2 text-[ink-dim]">
            PACK // {pack.name.slice(0, 12).toUpperCase()}
          </span>
          <div className="absolute right-2.5 top-2.5 flex h-7 items-center gap-1.5 rounded-[3px] bg-[rgb(var(--surface))]/90 backdrop-blur px-2">
            <Sparkles className="h-3 w-3 text-brand" />
            <span className="font-mono text-[12px] font-bold text-ink">{fmtPrice(pack.price)}</span>
          </div>
          {pack.available_count !== null && (
            <span className="absolute bottom-2 left-2.5 rounded-[3px] bg-[rgb(var(--surface))]/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ink-faint backdrop-blur">
              Осталось: {pack.available_count - pack.opened_count}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5 px-3 pb-3 pt-2.5">
          <span className="font-display text-[13px] font-bold text-ink">{pack.name}</span>
          <span className="line-clamp-2 text-[11px] text-ink-faint leading-relaxed">
            {pack.description}
          </span>
        </div>
      </button>

      {open && (
        <PackOpenModal
          pack={pack}
          version={version}
          items={items}
          userId={userId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PackOpenModal({
  pack,
  version,
  items,
  userId,
  onClose,
}: {
  pack: Pack;
  version: PackVersion | null;
  items: PackItem[];
  userId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { play } = useSound();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChipActionResult | null>(null);

  const chipsInTier = (tierId: number) =>
    items.filter((i) => i.tier_id === tierId).length;

  const open = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const res = await openPack(pack.id);
    setLoading(false);
    if (res.ok) {
      play("pack");
      setResult(res.data!);
    } else {
      toast(res.error, "error");
    }
  };

  const openAgain = () => {
    setResult(null);
    router.refresh();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={result ? "Выпадение" : pack.name}
      size="sm"
      actions={
        result ? (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Закрыть
            </Button>
            <Button variant="primary" size="sm" onClick={openAgain}>
              Открыть ещё
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button variant="primary" size="sm" loading={loading} onClick={open}>
              Открыть за {fmtPrice(pack.price)}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="animate-pop-in flex flex-col items-center gap-3 py-4">
          <ChipImage name={result.name} rarity={result.rarity} size={132} />
          <p className="font-display text-base font-bold text-ink">{result.name}</p>
          <RarityBadge slug={result.rarity} name={result.rarity} />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] text-ink-soft">{pack.description}</p>
          {version && (
            <div className="flex flex-col gap-1.5 rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
              {version.config.tiers.map((t) => (
                <div key={t.tier_id} className="flex items-center gap-2 text-[12px]">
                  <span className="flex-1 text-ink-soft">
                    Тир «{t.name ?? `#${t.tier_id}`}» — {t.weight}%
                  </span>
                  <span className="text-ink-faint">фишек: {chipsInTier(t.tier_id)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-ink-dim">
            Выпадение определяется на сервере по фиксированным вероятностям конфигурации пака.
          </p>
        </div>
      )}
    </Modal>
  );
}