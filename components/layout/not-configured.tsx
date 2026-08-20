export function NotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="panel w-full max-w-md p-6 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-[4px] bg-brand font-display text-[18px] font-black text-[#0a0a12] mx-auto">
          N
        </span>
        <h1 className="mt-3 font-display text-xl font-extrabold tracking-tight text-ink">
          NUFFY
        </h1>
        <p className="mt-3 text-[13px] text-ink-soft">
          Приложение не настроено. Подключите Supabase-проект:
        </p>
        <ol className="mt-3 space-y-1.5 text-left text-[12px] text-ink-faint">
          <li>1. Создайте проект на supabase.com</li>
          <li>
            2. Выполните миграции из{" "}
            <code className="rounded bg-canvas-inset px-1.5 py-0.5 text-ink-soft">
              supabase/migrations
            </code>{" "}
            в SQL-редакторе
          </li>
          <li>
            3. Заполните <code className="rounded bg-canvas-inset px-1.5 py-0.5 text-ink-soft">.env.local</code>:
            URL, anon key, service role key
          </li>
          <li>4. Перезапустите сервер</li>
        </ol>
        <p className="mt-3 text-[10px] text-ink-dim">
          NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
        </p>
      </div>
    </div>
  );
}