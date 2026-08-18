"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Wallet,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Shield,
  ChevronDown,
} from "lucide-react";
import { cn, fmtPrice } from "@/lib/utils";
import { Popover, MenuItem } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BalanceModal } from "@/components/profile/balance-modal";
import { signOut } from "@/lib/actions/auth";

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
  const { toast } = useToast();
  const [balanceOpen, setBalanceOpen] = useState(false);

  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-panel-border bg-base-elevated/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-5 px-4 sm:px-6">
        <Link
          href="/shop"
          className="font-display text-lg font-bold tracking-tight text-ink transition-colors hover:text-brand"
        >
          NUFFY
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                active(t.href)
                  ? "bg-panel-hover text-ink"
                  : "text-ink-faint hover:bg-panel-hover/60 hover:text-ink-soft"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => setBalanceOpen(true)}
                className="flex h-9 items-center gap-2 rounded-lg border border-panel-border bg-panel px-3 text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:text-brand"
                title="Пополнить / вывести"
              >
                <Wallet className="h-4 w-4 text-brand" />
                <span className="tabular">{fmtPrice(user.balance)}</span>
              </button>

              <Popover
                align="right"
                width="w-60"
                trigger={(open) => (
                  <button
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-lg border border-panel-border bg-panel px-2 transition-colors hover:border-panel-strong",
                      open && "border-panel-strong"
                    )}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/15 text-[11px] font-bold text-brand">
                      {user.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden text-[13px] font-medium text-ink sm:block">
                      {user.username}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />
                  </button>
                )}
              >
                {(close) => (
                  <>
                    <div className="px-2.5 py-2">
                      <p className="text-[13px] font-semibold text-ink">
                        {user.username}
                      </p>
                      <p className="text-[11px] text-ink-faint">
                        ID: {user.accountId}
                      </p>
                    </div>
                    <div className="my-1 h-px bg-panel-border" />
                    <MenuItem
                      icon={<UserIcon className="h-4 w-4" />}
                      onClick={() => {
                        close();
                        router.push("/profile");
                      }}
                    >
                      Профиль
                    </MenuItem>
                    <MenuItem
                      icon={<RefreshCw className="h-4 w-4" />}
                      onClick={() => {
                        close();
                        router.push("/trades");
                      }}
                    >
                      Обмены
                    </MenuItem>
                    {user.isAdmin && (
                      <>
                        <div className="my-1 h-px bg-panel-border" />
                        <MenuItem
                          icon={<Shield className="h-4 w-4" />}
                          onClick={() => {
                            close();
                            router.push("/admin/dashboard");
                          }}
                        >
                          Админ-панель
                        </MenuItem>
                      </>
                    )}
                    <div className="my-1 h-px bg-panel-border" />
                    <MenuItem
                      danger
                      icon={<LogOut className="h-4 w-4" />}
                      onClick={async () => {
                        close();
                        await signOut();
                        toast("Вы вышли из аккаунта", "info");
                        router.push("/login");
                        router.refresh();
                      }}
                    >
                      Выйти
                    </MenuItem>
                  </>
                )}
              </Popover>
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

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-panel-border px-3 py-1.5 md:hidden">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              active(t.href)
                ? "bg-panel-hover text-ink"
                : "text-ink-faint hover:text-ink-soft"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {user && (
        <BalanceModal open={balanceOpen} onClose={() => setBalanceOpen(false)} />
      )}
    </header>
  );
}