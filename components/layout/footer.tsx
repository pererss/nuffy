import Link from "next/link";

const links = [
  { href: "/legal/rules", label: "Правила" },
  { href: "/legal/privacy", label: "Политика конфиденциальности" },
  { href: "/legal/terms", label: "Пользовательское соглашение" },
  { href: "/legal/contacts", label: "Контакты" },
];

export function Footer() {
  return (
    <footer className="border-t border-panel-border bg-canvas-elevated/70">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-display text-sm font-bold tracking-tight text-ink">
            <span className="inline-block h-2 w-2 rounded-[2px] bg-brand" />
            NUFFY
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
            marketplace коллекционных фишек
          </p>
          <a
            href="mailto:nuffysup@gmail.com"
            className="mt-1.5 block font-mono text-[11px] text-ink-faint transition-colors hover:text-brand"
          >
            support: nuffysup@gmail.com
          </a>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-ink-soft"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}