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
  size = 88,
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
        "panel group relative flex flex-col overflow-hidden transition-all duration-150 hover:border-brand/40 hover:shadow-glow",
        className
      )}
    >
      <Link
        href={href}
        className="flex flex-col items-center gap-3 px-3 pt-4 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ChipImage
          name={chip.name}
          imageUrl={chip.image_url}
          crop={chip.image_crop}
          rarity={chip.rarity.slug}
          size={size}
        />
        <div className="flex w-full flex-col gap-1 pb-3">
          <span className="truncate text-[13px] font-semibold leading-tight text-ink">
            {chip.name}
          </span>
          <span className="text-[11px] text-ink-faint">
            {chip.collection.name} · №{chip.number}
          </span>
          <div className="flex items-center gap-1.5 pt-0.5">
            <RarityBadge slug={chip.rarity.slug} name={chip.rarity.name} />
            <LevelBadge level={chip.level.name.replace("Level ", "L")} />
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-panel-border px-3 py-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          {price}
          {sub && <span className="truncate text-[11px] text-ink-faint">{sub}</span>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function ChipCardPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("panel flex flex-col items-center gap-3 p-4", className)}>
      <div className="h-[88px] w-[88px] animate-pulse rounded-full bg-panel-hover" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-panel-hover" />
      <div className="h-2.5 w-1/2 animate-pulse rounded bg-panel-hover" />
      <div className="mt-2 h-8 w-full animate-pulse rounded-lg bg-panel-hover" />
    </div>
  );
}