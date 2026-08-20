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
        "panel group flex flex-col overflow-hidden transition-all duration-150 card-lift",
        className
      )}
    >
      {/* Top accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <Link
        href={href}
        className="flex flex-col items-center gap-2.5 px-3 pt-4 outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))]/40"
      >
        {/* Chip image */}
        <ChipImage
          name={chip.name}
          imageUrl={chip.image_url}
          crop={chip.image_crop}
          rarity={chip.rarity.slug}
          size={size}
        />

        {/* Info */}
        <div className="flex w-full flex-col gap-1 pb-1.5 text-center">
          <span className="truncate text-[13px] font-semibold leading-tight text-ink">
            {chip.name}
          </span>
          <span className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-ink-faint">
            {chip.collection.name} · №{chip.number}
          </span>
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <RarityBadge slug={chip.rarity.slug} name={chip.rarity.name} />
            <LevelBadge level={chip.level.name.replace("Level ", "L")} />
          </div>
        </div>
      </Link>

      {/* Bottom bar */}
      <div className="flex flex-1 items-center justify-between gap-2 border-t border-[rgb(var(--border))] px-3 py-2.5">
        <div className="flex min-w-0 flex-col gap-0.5 text-left">
          {price}
          {sub && (
            <span className="truncate font-mono text-[9px] uppercase tracking-[0.1em] text-ink-faint">
              {sub}
            </span>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function ChipCardPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("panel flex flex-col items-center gap-2.5 p-3", className)}>
      <div className="h-[96px] w-[96px] skeleton" />
      <div className="h-3 w-2/3 skeleton" style={{ maxWidth: '80px' }} />
      <div className="h-2.5 w-1/2 skeleton" style={{ maxWidth: '60px' }} />
      <div className="mt-1 h-7 w-full skeleton" />
    </div>
  );
}