"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ok" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-[#241803] hover:bg-brand-hover font-bold border border-brand-deep/25 shadow-[0_2px_0_rgb(120_84_14_/_0.4)] active:translate-y-[1px] active:shadow-[0_1px_0_rgb(120_84_14_/_0.4)]",
  secondary:
    "bg-surface text-ink hover:bg-surface-hover border border-panel-strong shadow-[0_2px_0_rgb(0_0_0_/_0.08)] active:translate-y-[1px] active:shadow-none",
  ghost: "text-ink-soft hover:text-ink hover:bg-panel-hover",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 shadow-[0_2px_0_rgb(213_80_76_/_0.25)] active:translate-y-[1px] active:shadow-none",
  ok: "bg-ok/10 text-ok border border-ok/30 hover:bg-ok/20 shadow-[0_2px_0_rgb(47_155_110_/_0.25)] active:translate-y-[1px] active:shadow-none",
  outline:
    "border border-panel-strong text-ink hover:border-brand/50 hover:text-brand bg-transparent shadow-[0_2px_0_rgb(0_0_0_/_0.06)] active:translate-y-[1px] active:shadow-none",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[7px]",
  md: "h-10 px-4 text-sm gap-2 rounded-[7px]",
  lg: "h-11 px-6 text-[15px] gap-2 rounded-[9px]",
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
          "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
        "inline-flex items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-panel-hover hover:text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    />
  );
}
