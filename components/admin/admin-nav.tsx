"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CircleDot,
  Package,
  Store,
  ArrowLeftRight,
  ArrowLeftRight as Trades,
  Ticket,
  Ban,
  ScrollText,
  Settings,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/collections", label: "Коллекции", icon: FolderOpen },
  { href: "/admin/chips", label: "Фишки", icon: CircleDot },
  { href: "/admin/packs", label: "Паки", icon: Package },
  { href: "/admin/marketplace", label: "Площадка", icon: Store },
  { href: "/admin/trades", label: "Обмены", icon: Trades },
  { href: "/admin/upgrades", label: "Апгрейды", icon: Flame },
  { href: "/admin/transactions", label: "Транзакции", icon: ArrowLeftRight },
  { href: "/admin/promocodes", label: "Промокоды", icon: Ticket },
  { href: "/admin/blocks", label: "Блокировки", icon: Ban },
  { href: "/admin/audit", label: "Аудит", icon: ScrollText },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <nav className="sticky top-0 flex flex-col gap-0.5 p-2.5">
        {/* Admin label */}
        <span className="mb-2 px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink-dim">
          NUFFY ADMIN
        </span>

        {items.map((it) => {
          const active =
            pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-ink-faint hover:bg-[rgb(var(--surface-hover))] hover:text-ink-soft"
              )}
            >
              <it.icon className={cn(
                "h-3.5 w-3.5 shrink-0",
                active ? "text-brand" : "text-ink-dim"
              )} />
              {it.label}
            </Link>
          );
        })}

        <div className="my-1.5 h-px bg-[rgb(var(--border))]" />

        <Link
          href="/shop"
          className="flex items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-[12px] font-medium text-ink-dim transition-colors hover:bg-[rgb(var(--surface-hover))] hover:text-ink-soft"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-ink-dim" />
          На сайт
        </Link>
      </nav>
    </aside>
  );
}

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-56px)] bg-[rgb(var(--bg))]">
      <AdminNav />
      <main className="min-w-0 flex-1 px-5 py-5 sm:px-6 lg:px-8">
        <h1 className="mb-4 font-display text-[17px] font-bold tracking-tight text-ink">{title}</h1>
        {children}
      </main>
    </div>
  );
}