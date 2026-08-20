"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Vote } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useSound } from "@/components/sound";
import { buyChip } from "@/lib/actions/shop";
import { cn } from "@/lib/utils";

export function BuyChipButton({
  chipId,
  userId,
  stock,
  size = "sm",
  className,
  variant = "primary",
  label = "Купить",
}: {
  chipId: string;
  userId: string | null;
  stock: number;
  size?: "sm" | "md";
  className?: string;
  variant?: "primary" | "secondary";
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { play } = useSound();
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const res = await buyChip(chipId);
    setLoading(false);
    if (res.ok) {
      play("purchase");
      toast("Фишка куплена и добавлена в инвентарь", "success");
      router.refresh();
    } else {
      toast(res.error, "error");
    }
  };

  const classes = cn(
    "inline-flex items-center justify-center gap-1.5 font-semibold transition-all btn-press",
    size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-9 px-3 text-[13px]",
    variant === "primary"
      ? "bg-brand text-[#0a0a12] hover:bg-brand-hover rounded-[4px]"
      : "bg-[rgb(var(--surface-hover))] text-ink hover:bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-[4px]",
    className
  );

  if (stock <= 0) {
    return (
      <span className="inline-flex h-7 items-center rounded-[4px] border border-[rgb(var(--border))] px-2.5 text-[11px] font-medium text-ink-dim">
        Распродано
      </span>
    );
  }

  return (
    <button onClick={buy} disabled={loading} className={classes}>
      <Vote className={cn("opacity-70", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {loading ? "…" : label}
    </button>
  );
}

export function BuyLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}