"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useSound } from "@/components/sound";
import { buyChip, toggleFavorite } from "@/lib/actions/shop";
import { createListing, buyListing } from "@/lib/actions/marketplace";
import { cn, fmtPrice } from "@/lib/utils";

export function FavoriteButton({
  chipId,
  liked,
}: {
  chipId: string;
  liked: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        const res = await toggleFavorite(chipId);
        setLoading(false);
        if (res.ok) {
          router.refresh();
        } else {
          toast(res.error, "error");
        }
      }}
      disabled={loading}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
        liked
          ? "border-danger/40 bg-danger/10 text-danger"
          : "border-panel-border text-ink-soft hover:border-danger/40 hover:text-danger"
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      {liked ? "В избранном" : "В избранное"}
    </button>
  );
}

export function BuyChipBig({
  chipId,
  stock,
  price,
}: {
  chipId: string;
  stock: number;
  price: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { play } = useSound();
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    setLoading(true);
    const res = await buyChip(chipId);
    setLoading(false);
    if (res.ok) {
      play("purchase");
      toast("Фишка добавлена в инвентарь", "success");
      router.refresh();
    } else {
      toast(res.error, "error");
      if (res.error === "Войдите, чтобы продолжить") router.push("/login");
    }
  };

  if (stock <= 0) {
    return (
      <span className="inline-flex h-11 items-center rounded-xl border border-panel-border px-5 text-sm text-ink-dim">
        Распродано
      </span>
    );
  }

  return (
    <Button variant="primary" size="lg" onClick={buy} loading={loading}>
      Купить за {fmtPrice(price)}
    </Button>
  );
}

export function SellChipModal({
  instanceId,
  chipName,
  locked,
  remainingText,
  collectionSoldOut,
  listed,
  trigger,
}: {
  instanceId: string;
  chipName: string;
  locked: boolean;
  remainingText?: string;
  collectionSoldOut: boolean;
  listed: boolean;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const value = parseFloat(price);
    if (!value || value <= 0) {
      toast("Введите цену", "warning");
      return;
    }
    setLoading(true);
    const res = await createListing(instanceId, value);
    setLoading(false);
    if (res.ok) {
      play("listing");
      toast("Объявление создано", "success");
      setOpen(false);
      router.refresh();
    } else {
      toast(res.error, "error");
    }
  };

  const allowed = !locked && collectionSoldOut && !listed;

  return (
    <>
      {trigger(() => setOpen(true))}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Продажа: ${chipName}`}
        size="sm"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={submit}
              disabled={!allowed}
            >
              Выставить
            </Button>
          </>
        }
      >
        {!allowed ? (
          <div className="flex flex-col gap-1.5 rounded-lg border border-warn/40 bg-warn/10 p-3.5 text-[13px] text-warn">
            <p className="font-semibold">Продажа недоступна</p>
            {listed && <p>Причина: фишка уже выставлена на площадке</p>}
            {!listed && locked && (
              <p>
                Причина: фишка заблокирована
                {remainingText && (
                  <span className="block text-[12px] opacity-80">
                    Осталось: {remainingText}
                  </span>
                )}
              </p>
            )}
            {!listed && !locked && !collectionSoldOut && (
              <p>Причина: коллекция ещё не распродана</p>
            )}
          </div>
        ) : (
          <Field label="Цена, ₽" hint="Комиссия площадки: 0%">
            <Input
              type="number"
              min={1}
              step="0.01"
              placeholder="1000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
        )}
      </Modal>
    </>
  );
}

export function BuyListingButton({
  listingId,
  price,
  userId,
}: {
  listingId: string;
  price: number;
  userId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { play } = useSound();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const doBuy = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setLoading(true);
    const res = await buyListing(listingId);
    setLoading(false);
    if (res.ok) {
      play("purchase");
      toast("Фишка куплена! Новый 7-дневный lock активирован", "success");
      router.refresh();
      setConfirm(false);
    } else {
      toast(res.error, "error");
    }
  };

  return (
    <Button variant="primary" size="lg" onClick={doBuy} loading={loading}>
      {confirm ? "Подтвердить?" : `Купить за ${fmtPrice(price)}`}
    </Button>
  );
}

export function LinkToUpgrade({ href, label }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-panel-border px-4 text-sm font-medium text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
    >
      <ArrowUpRight className="h-4 w-4" />
      {label ?? "Апгрейд"}
    </Link>
  );
}
