"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ok" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[rgb(var(--brand))] text-[#0a0a12] hover:bg-[rgb(var(--brand-hover))] font-bold border border-[rgb(var(--brand))]/60 shadow-[0_2px_0_rgb(90_50_180_/_0.4)] active:translate-y-[1px] active:shadow-[0_1px_0_rgb(90_50_180_/_0.4)]",
  secondary:
    "bg-[rgb(var(--surface-2))] text-ink hover:bg-[rgb(var(--surface-hover))] border border-[rgb(var(--border))] shadow-[0_2px_0_rgb(0_0_0_/_0.15)] active:translate-y-[1px] active:shadow-none",
  ghost: "text-ink-soft hover:text-ink hover:bg-[rgb(var(--surface-hover))]",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 shadow-[0_2px_0_rgb(230_70_80_/_0.25)] active:translate-y-[1px] active:shadow-none",
  ok: "bg-ok/10 text-ok border border-ok/30 hover:bg-ok/20 shadow-[0_2px_0_rgb(60_210_140_/_0.25)] active:translate-y-[1px] active:shadow-none",
  outline:
    "border border-[rgb(var(--border))] text-ink hover:border-[rgb(var(--brand-border))] hover:text-brand bg-transparent shadow-[0_2px_0_rgb(0_0_0_/_0.1)] active:translate-y-[1px] active:shadow-none",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[11px] gap-1.5 rounded-[4px]",
  md: "h-9 px-3.5 text-[13px] gap-2 rounded-[4px]",
  lg: "h-11 px-5 text-[14px] gap-2 rounded-[5px]",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "secondary", size = "md", loading, disabled, children, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))]/40 disabled:pointer-events-none disabled:opacity-40 btn-press",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

export function IconButton({
  className,
  size = "md",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[4px] text-ink-faint transition-colors hover:bg-[rgb(var(--surface-hover))] hover:text-ink outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand))]/40 disabled:opacity-40 btn-press",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    />
  );
}