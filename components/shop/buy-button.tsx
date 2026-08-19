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
    "inline-flex items-center justify-center gap-1.5 font-semibold transition-all rounded-lg",
    size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
    variant === "primary"
      ? "bg-brand text-black hover:bg-brand-hover"
      : "bg-panel-hover text-ink hover:bg-panel-strong border border-panel-border",
    className
  );

  if (stock <= 0) {
    return (
      <span className="inline-flex h-8 items-center rounded-lg border border-panel-border px-3 text-[12px] font-medium text-ink-dim">
        Распродано
      </span>
    );
  }

  return (
    <button onClick={buy} disabled={loading} className={classes}>
      <Vote className={cn("opacity-70", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
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
