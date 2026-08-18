"use client";

import Link from "next/link";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge, LevelBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChipWithMeta } from "@/lib/types";

export function ChipCard({
  chip,
  href,
  price,
  sub,
  action,
  className,
  size = 96,
}: {
  chip: ChipWithMeta;
  href: string;
  price: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "panel group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-cardHover",
        className
      )}
    >
      <Link
        href={href}
        className="flex flex-col items-center gap-3 px-4 pt-5 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ChipImage
          name={chip.name}
          imageUrl={chip.image_url}
          crop={chip.image_crop}
          rarity={chip.rarity.slug}
          size={size}
        />
        <div className="flex w-full flex-col gap-1 pb-2 text-center">
          <span className="truncate text-[14px] font-semibold leading-tight text-ink">
            {chip.name}
          </span>
          <span className="truncate text-[11px] text-ink-faint">
            {chip.collection.name} · №{chip.number}
          </span>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <RarityBadge slug={chip.rarity.slug} name={chip.rarity.name} />
            <LevelBadge level={chip.level.name.replace("Level ", "L")} />
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-panel-border px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5 text-left">
          {price}
          {sub && (
            <span className="truncate text-[11px] text-ink-faint">{sub}</span>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

export function ChipCardPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("panel flex flex-col items-center gap-3 p-5", className)}>
      <div className="h-[96px] w-[96px] animate-pulse rounded-full bg-surface-hover" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface-hover" />
      <div className="h-2.5 w-1/2 animate-pulse rounded bg-surface-hover" />
      <div className="mt-2 h-9 w-full animate-pulse rounded-lg bg-surface-hover" />
    </div>
  );
}
