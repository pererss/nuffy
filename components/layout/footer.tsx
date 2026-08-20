import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
      <div className="mx-auto flex w-full max-w-[1360px] flex-col items-start justify-between gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-[13px] font-bold tracking-[0.14em] text-ink">
            NUFFY
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim">
            коллекционные фишки · твой стиль
          </p>
          <a
            href="mailto:nuffysup@gmail.com"
            className="mt-1 block font-mono text-[10px] text-ink-faint transition-colors hover:text-brand"
          >
            nuffysup@gmail.com
          </a>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1.5">
          {[
            { href: "/legal/rules", label: "Правила" },
            { href: "/legal/privacy", label: "Конфиденциальность" },
            { href: "/legal/terms", label: "Соглашение" },
            { href: "/legal/contacts", label: "Контакты" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint transition-colors hover:text-ink-soft"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="font-mono text-[9px] text-ink-dim">
          © 2024 NUFFY
        </span>
      </div>
    </footer>
  );
}
