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
  Ticket,
  Ban,
  ScrollText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/collections", label: "Коллекции", icon: FolderOpen },
  { href: "/admin/chips", label: "Фишки", icon: CircleDot },
  { href: "/admin/packs", label: "Паки", icon: Package },
  { href: "/admin/marketplace", label: "Площадка", icon: Store },
  { href: "/admin/transactions", label: "Транзакции", icon: ArrowLeftRight },
  { href: "/admin/promocodes", label: "Промокоды", icon: Ticket },
  { href: "/admin/blocks", label: "Блокировки", icon: Ban },
  { href: "/admin/audit", label: "Аудит", icon: ScrollText },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-panel-border">
      <nav className="sticky top-14 flex flex-col gap-0.5 p-3">
        {items.map((it) => {
          const active =
            pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-panel-hover text-ink"
                  : "text-ink-faint hover:bg-panel-hover/60 hover:text-ink-soft"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
        <div className="my-2 h-px bg-panel-border" />
        <Link
          href="/shop"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-dim hover:bg-panel-hover/60 hover:text-ink-soft"
        >
          ← На сайт
        </Link>
      </nav>
    </aside>
  );
}

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <AdminNav />
      <main className="min-w-0 flex-1 px-5 py-5 sm:px-6">
        <h1 className="mb-4 font-display text-xl font-bold text-ink">{title}</h1>
        {children}
      </main>
    </div>
  );
}
