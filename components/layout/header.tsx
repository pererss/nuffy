"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wallet, ChevronDown, Plus, User } from "lucide-react";
import { cn, fmtPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { useState, useRef, useEffect } from "react";

const tabs = [
  { href: "/shop", label: "МАГАЗИН" },
  { href: "/inventory", label: "ИНВЕНТАРЬ" },
  { href: "/marketplace", label: "ТОРГОВАЯ ПЛОЩАДКА" },
  { href: "/upgrades", label: "АПГРЕЙДЫ" },
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Top accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

      {/* Main nav bar */}
      <div className="border-x-0 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <div className="mx-auto flex h-[56px] w-full max-w-[1360px] items-center px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/shop"
            className="flex shrink-0 items-center gap-0 outline-none transition-opacity hover:opacity-80"
          >
            <span className="font-display text-[18px] font-bold tracking-[0.18em] text-ink">
              NUFFY
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Tabs */}
          <nav className="hidden items-center gap-0 md:flex">
            {tabs.map((t, i) => {
              const isActive = active(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "relative flex h-[56px] items-center gap-2 px-4 text-[12px] font-medium tracking-[0.1em] outline-none transition-colors focus-visible:text-brand",
                    isActive ? "text-ink" : "text-ink-faint hover:text-ink-soft"
                  )}
                >
                  {/* Tab number */}
                  <span className={cn(
                    "font-mono text-[9px] font-bold tracking-wider transition-colors",
                    isActive ? "text-brand" : "text-ink-dim"
                  )}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Label */}
                  <span className="hidden lg:inline">{t.label}</span>

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-brand" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile tabs (scrollable) */}
          <nav className="flex items-center gap-0 overflow-x-auto border-l border-[rgb(var(--border))] md:hidden" style={{ marginLeft: 'auto', paddingLeft: '12px' }}>
            {tabs.map((t, i) => {
              const isActive = active(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "relative flex h-[56px] shrink-0 items-center px-3 text-[10px] font-medium tracking-[0.08em] outline-none transition-colors",
                    isActive ? "text-ink" : "text-ink-faint"
                  )}
                >
                  <span className={cn(
                    "font-mono text-[8px] font-bold",
                    isActive ? "text-brand" : "text-ink-dim"
                  )}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-brand" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-3 flex shrink-0 items-center gap-2" ref={profileRef}>
            <ThemeToggle />

            {user ? (
              <>
                {/* Balance */}
                <button
                  onClick={() => router.push("/profile")}
                  className="btn-press flex h-[34px] items-center gap-1.5 rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-2.5 text-left transition-colors hover:border-[rgb(var(--border-strong))]"
                >
                  <Wallet className="h-3.5 w-3.5 text-ink-faint" />
                  <span className="font-mono text-[12px] font-medium text-ink tabular">
                    {fmtPrice(user.balance)}
                  </span>
                  <Plus className="h-3 w-3 text-ink-dim" />
                </button>

                {/* Avatar + username */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="btn-press flex h-[34px] items-center gap-2 rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] pl-2 pr-2.5 transition-colors hover:border-[rgb(var(--border-strong))]"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-[3px] bg-brand/15 font-display text-[11px] font-bold text-brand">
                      {user.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden text-[12px] font-medium text-ink sm:inline">
                      {user.username}
                    </span>
                    <ChevronDown className={cn(
                      "h-3 w-3 text-ink-faint transition-transform",
                      profileOpen && "rotate-180"
                    )} />
                  </button>

                  {/* Profile dropdown */}
                  {profileOpen && (
                    <div className="animate-scale-in absolute right-0 top-[40px] w-[240px] rounded-[6px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-modal">
                      {/* Corner marks */}
                      <div className="pointer-events-none absolute -left-[1px] -top-[1px] h-3 w-3 border-l border-t border-[rgb(var(--border-strong))]" />
                      <div className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-3 w-3 border-r border-b border-[rgb(var(--border-strong))]" />

                      <div className="p-3">
                        {/* User info */}
                        <div className="mb-3 flex items-center gap-2.5 border-b border-[rgb(var(--border))] pb-3">
                          <span className="grid h-9 w-9 place-items-center rounded-[4px] bg-brand/15 font-display text-[14px] font-bold text-brand">
                            {user.username.slice(0, 1).toUpperCase()}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-ink">{user.username}</span>
                            <span className="font-mono text-[10px] text-ink-dim">{user.accountId}</span>
                          </div>
                        </div>

                        {/* Balance */}
                        <div className="mb-3 flex items-center justify-between border-b border-[rgb(var(--border))] pb-3">
                          <span className="text-[11px] text-ink-faint">Баланс</span>
                          <span className="font-mono text-[13px] font-medium text-brand tabular">
                            {fmtPrice(user.balance)} ₽
                          </span>
                        </div>

                        {/* Menu items */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                            className="btn-press flex w-full items-center gap-2 rounded-[4px] px-2.5 py-2 text-left text-[13px] text-ink-soft transition-colors hover:bg-[rgb(var(--surface-hover))]"
                          >
                            <User className="h-3.5 w-3.5 text-ink-faint" />
                            Профиль
                          </button>
                          {user.isAdmin && (
                            <button
                              onClick={() => { setProfileOpen(false); router.push("/admin/dashboard"); }}
                              className="btn-press flex w-full items-center gap-2 rounded-[4px] px-2.5 py-2 text-left text-[13px] text-ink-soft transition-colors hover:bg-[rgb(var(--surface-hover))]"
                            >
                              <span className="h-3.5 w-3.5 rounded-[2px] bg-brand/20" />
                              Админ-панель
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="primary">
                  Войти
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
    </header>
  );
}
