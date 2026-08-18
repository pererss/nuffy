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
        "inline-flex h-5 items-center gap-1.5 rounded-md px-1.5 text-[11px] font-semibold tracking-wide",
        className
      )}
      style={
        resolvedColor
          ? variant
            ? {
                color: `rgb(${resolvedColor})`,
                backgroundColor: `rgb(${resolvedColor} / 0.12)`,
                boxShadow: `inset 0 0 0 1px rgb(${resolvedColor} / 0.35)`,
              }
            : {
                color: resolvedColor,
                backgroundColor: `${resolvedColor}1a`,
                boxShadow: `inset 0 0 0 1px ${resolvedColor}40`,
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
        "inline-flex h-5 items-center rounded-md border border-panel-strong bg-canvas-inset px-1.5 text-[11px] font-semibold text-ink-soft",
        className
      )}
    >
      {level}
    </span>
  );
}

export function LockBadge({ locked }: { locked: boolean }) {
  return locked ? (
    <span className="inline-flex h-5 items-center gap-1 rounded-md bg-warn/10 px-1.5 text-[11px] font-bold tracking-wider text-warn shadow-[inset_0_0_0_1px_rgba(240,135,91,0.35)]">
      <Lock className="h-3 w-3" /> LOCKED
    </span>
  ) : (
    <span className="inline-flex h-5 items-center gap-1 rounded-md bg-ok/10 px-1.5 text-[11px] font-bold tracking-wider text-ok shadow-[inset_0_0_0_1px_rgba(61,214,140,0.35)]">
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
    ok: "bg-ok/10 text-ok shadow-[inset_0_0_0_1px_rgba(61,214,140,0.35)]",
    warn: "bg-warn/10 text-warn shadow-[inset_0_0_0_1px_rgba(240,135,91,0.35)]",
    danger: "bg-danger/10 text-danger shadow-[inset_0_0_0_1px_rgba(242,95,102,0.35)]",
    info: "bg-info/10 text-info shadow-[inset_0_0_0_1px_rgba(88,166,232,0.35)]",
    dim: "bg-panel-hover text-ink-faint shadow-[inset_0_0_0_1px_rgba(42,49,66,1)]",
  };
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold",
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
