"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wallet, ChevronDown } from "lucide-react";
import { cn, fmtPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";

const tabs = [
  { href: "/shop", label: "Магазин" },
  { href: "/inventory", label: "Инвентарь" },
  { href: "/marketplace", label: "Торговая площадка" },
  { href: "/upgrades", label: "Апгрейды" },
];

export function Header({
  user,
}: {
  user: {
    id: string;
    username: string;
    accountId: string;
    balance: number;
    role: string;
    isAdmin: boolean;
  } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-panel-border bg-canvas-elevated/92 backdrop-blur supports-[backdrop-filter]:bg-canvas-elevated/78">
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-brand/55 to-transparent" />

      <div className="mx-auto flex h-[52px] w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6">
        <Link href="/shop" className="group flex shrink-0 items-center gap-2.5 outline-none">
          <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-brand font-display text-[13px] font-black text-[#241803] shadow-[0_2px_0_rgb(120_84_14_/_0.35)] transition-transform group-hover:-translate-y-px">
            N
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight text-ink transition-colors group-hover:text-brand">
            NUFFY
          </span>
        </Link>

        <span className="tech-label hidden shrink-0 text-ink-dim lg:block">
          // MARKET
        </span>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {tabs.map((t, i) => {
            const isActive = active(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "group flex h-9 items-center gap-1.5 rounded-[7px] px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40",
                  isActive
                    ? "bg-surface text-ink shadow-[inset_0_0_0_1px_rgb(var(--border-strong)/0.7)]"
                    : "text-ink-faint hover:bg-surface/60 hover:text-ink-soft"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[9px] font-bold tracking-wider",
                    isActive ? "text-brand" : "text-ink-dim"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t.label}
                <span
                  className={cn(
                    "ml-0.5 h-1.5 w-1.5 rounded-[2px] transition-colors",
                    isActive ? "bg-brand" : "bg-transparent group-hover:bg-ink-dim"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />

          {user ? (
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2.5 rounded-[7px] border border-panel-border bg-surface py-1.5 pl-2 pr-2.5 text-left transition-colors hover:border-brand/45 hover:shadow-[0_2px_0_rgb(0_0_0_/_0.06)]"
              title="Открыть профиль"
            >
              <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-brand/15 font-display text-[12px] font-bold text-brand">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="max-w-[110px] truncate text-[12px] font-semibold text-ink">
                  {user.username}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold tabular text-brand">
                  <Wallet className="h-3 w-3" />
                  {fmtPrice(user.balance)}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />
            </button>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="primary">
                Войти
              </Button>
            </Link>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-panel-border bg-canvas-inset/40 px-3 py-1.5 md:hidden">
        {tabs.map((t, i) => {
          const isActive = active(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-surface text-ink"
                  : "text-ink-faint hover:bg-surface/60 hover:text-ink-soft"
              )}
            >
              <span
                className={cn(
                  "font-mono text-[9px] font-bold",
                  isActive ? "text-brand" : "text-ink-dim"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}