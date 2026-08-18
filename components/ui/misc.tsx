import { cn, fmtPrice } from "@/lib/utils";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("panel", className)}>{children}</div>;
}

export function PanelHeader({
  title,
  right,
  className,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-panel-border px-4 py-3",
        className
      )}
    >
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "ok" | "warn" | "danger" | "info";
}) {
  const tones = {
    default: "text-ink",
    ok: "text-ok",
    warn: "text-warn",
    danger: "text-danger",
    info: "text-info",
  };
  return (
    <div className="panel flex flex-col gap-1 px-4 py-3.5">
      <span className="label-base">{label}</span>
      <span className={cn("font-display text-xl font-bold tabular", tones[tone])}>
        {value}
      </span>
      {sub && <span className="text-xs text-ink-faint">{sub}</span>}
    </div>
  );
}

export function Price({
  value,
  className,
  size = "md",
}: {
  value: number | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-[13px] font-semibold",
    md: "text-[15px] font-bold",
    lg: "text-2xl font-bold tracking-tight",
  };
  return (
    <span className={cn("tabular text-ink", sizes[size], className)}>
      {fmtPrice(value)}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-panel-strong px-6 py-14 text-center",
        className
      )}
    >
      {icon && <div className="mb-1 text-ink-dim">{icon}</div>}
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="max-w-sm text-[13px] text-ink-faint">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-panel-hover",
        className
      )}
    />
  );
}

export function PageHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-[13px] text-ink-faint">{description}</p>
        )}
      </div>
      {right}
    </div>
  );
}
