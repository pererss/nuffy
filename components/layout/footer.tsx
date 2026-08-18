import Link from "next/link";

const links = [
  { href: "/legal/rules", label: "Правила" },
  { href: "/legal/privacy", label: "Политика конфиденциальности" },
  { href: "/legal/terms", label: "Пользовательское соглашение" },
  { href: "/legal/contacts", label: "Контакты" },
];

export function Footer() {
  return (
    <footer className="border-t border-panel-border bg-canvas-elevated">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="font-display text-sm font-bold tracking-tight text-ink">
            NUFFY
          </p>
          <a
            href="mailto:nuffysup@gmail.com"
            className="mt-0.5 block text-[12px] text-ink-faint transition-colors hover:text-brand"
          >
            Поддержка: nuffysup@gmail.com
          </a>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[12px] text-ink-faint transition-colors hover:text-ink-soft"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
