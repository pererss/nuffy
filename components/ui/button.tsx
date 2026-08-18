"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ok" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-black hover:bg-brand-hover active:bg-brand/90 shadow-[0_1px_8px_rgba(240,185,59,0.25)] font-semibold",
  secondary:
    "bg-panel-hover text-ink hover:bg-panel-strong border border-panel-border",
  ghost: "text-ink-soft hover:text-ink hover:bg-panel-hover",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
  ok: "bg-ok/10 text-ok border border-ok/30 hover:bg-ok/20",
  outline:
    "border border-panel-strong text-ink hover:border-brand/50 hover:text-brand",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-[15px] gap-2 rounded-xl",
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