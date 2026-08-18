"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ pages, current }: { pages: number; current: number }) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (pages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    p <= 1 ? sp.delete("page") : sp.set("page", String(p));
    return `${pathname}?${sp.toString()}`;
  };

  const items: Array<number | "…"> = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - current) <= 2) items.push(p);
    else if (items[items.length - 1] !== "…") items.push("…");
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      <Link
        href={href(current - 1)}
        aria-disabled={current <= 1}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg border border-panel-border text-ink-soft transition-colors hover:border-panel-strong hover:text-ink",
          current <= 1 && "pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {items.map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className="px-1 text-ink-dim">
            …
          </span>
        ) : (
          <Link
            key={it}
            href={href(it)}
            className={cn(
              "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-[13px] font-medium transition-colors",
              it === current
                ? "border-brand/50 bg-brand/10 text-brand"
                : "border-panel-border text-ink-soft hover:border-panel-strong hover:text-ink"
            )}
          >
            {it}
          </Link>
        )
      )}
      <Link
        href={href(current + 1)}
        aria-disabled={current >= pages}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg border border-panel-border text-ink-soft transition-colors hover:border-panel-strong hover:text-ink",
          current >= pages && "pointer-events-none opacity-40"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
