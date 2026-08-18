export function NotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      <div className="panel w-full max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          NUFFY
        </h1>
        <p className="mt-4 text-sm text-ink-soft">
          Приложение не настроено. Подключите Supabase-проект:
        </p>
        <ol className="mt-4 space-y-1.5 text-left text-[13px] text-ink-faint">
          <li>1. Создайте проект на supabase.com</li>
          <li>
            2. Выполните миграции из{" "}
            <code className="rounded bg-base-inset px-1 py-0.5 text-ink-soft">
              supabase/migrations
            </code>{" "}
            в SQL-редакторе
          </li>
          <li>
            3. Заполните <code className="rounded bg-base-inset px-1 py-0.5 text-ink-soft">.env.local</code>:
            URL, anon key, service role key
          </li>
          <li>4. Перезапустите сервер</li>
        </ol>
        <p className="mt-4 text-xs text-ink-dim">
          Env: NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY ·
          SUPABASE_SERVICE_ROLE_KEY
        </p>
      </div>
    </div>
  );
}