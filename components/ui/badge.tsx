"use client";

import { Loader2, Lock, Check, Minus } from "lucide-react";
import { cn, rarityColor } from "@/lib/utils";

const variantColors: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  info: "var(--info)",
  neutral: "var(--ink-faint)",
};

export function Badge({
  className,
  children,
  color,
  tone = "default",
  variant,
}: {
  className?: string;
  children: React.ReactNode;
  color?: string;
  tone?: "default" | "dot";
  variant?: "ok" | "warn" | "danger" | "info" | "neutral";
}) {
  const resolvedColor = variant ? variantColors[variant] : color;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-[3px] px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em]",
        className
      )}
      style={
        resolvedColor
          ? variant
            ? {
                color: `rgb(${resolvedColor})`,
                backgroundColor: `rgb(${resolvedColor} / 0.1)`,
                border: `1px solid rgb(${resolvedColor} / 0.25)`,
              }
            : {
                color: resolvedColor,
                backgroundColor: `${resolvedColor}1a`,
                border: `1px solid ${resolvedColor}40`,
              }
          : undefined
      }
    >
      {tone === "dot" && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: variant ? `rgb(${resolvedColor})` : resolvedColor }}
        />
      )}
      {children}
    </span>
  );
}

export function RarityBadge({
  slug,
  name,
  className,
}: {
  slug: string;
  name?: string;
  className?: string;
}) {
  const color = rarityColor(slug);
  return (
    <Badge color={color} tone="dot" className={className}>
      {name ?? slug}
    </Badge>
  );
}

export function LevelBadge({ level, className }: { level: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-[3px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft",
        className
      )}
    >
      {level}
    </span>
  );
}

export function LockBadge({ locked }: { locked: boolean }) {
  return locked ? (
    <span className="inline-flex h-5 items-center gap-1 rounded-[3px] bg-warn/10 px-1.5 font-mono text-[9px] font-bold tracking-[0.14em] text-warn border border-warn/25">
      <Lock className="h-3 w-3" /> LOCKED
    </span>
  ) : (
    <span className="inline-flex h-5 items-center gap-1 rounded-[3px] bg-ok/10 px-1.5 font-mono text-[9px] font-bold tracking-[0.14em] text-ok border border-ok/25">
      <Check className="h-3 w-3" /> SELLABLE
    </span>
  );
}

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: "ok" | "warn" | "danger" | "info" | "dim";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    ok: "bg-ok/10 text-ok border border-ok/25",
    warn: "bg-warn/10 text-warn border border-warn/25",
    danger: "bg-danger/10 text-danger border border-danger/25",
    info: "bg-info/10 text-info border border-info/25",
    dim: "bg-[rgb(var(--surface-hover))] text-ink-faint border border-[rgb(var(--border))]",
  };
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-[3px] px-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin text-ink-faint", className)} />;
}

export function Dot({ className }: { className?: string }) {
  return <Minus className={cn("h-0 w-0", className)} />;
}