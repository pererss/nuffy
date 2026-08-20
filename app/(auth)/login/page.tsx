"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { signIn, signInWithGoogle } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (res.ok) {
      router.push("/shop");
      router.refresh();
    } else {
      toast(res.error, "error");
    }
  };

  const google = async () => {
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    setGoogleLoading(false);
    if (res.ok && res.data?.url) {
      window.location.href = res.data.url;
    } else if (!res.ok && res.error !== "Google OAuth не включён") {
      toast(res.error, "error");
    }
  };

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 grid-bg opacity-60"
        style={{
          maskImage: "radial-gradient(40rem 40rem at 50% 40%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(40rem 40rem at 50% 40%, black, transparent 75%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(42rem 42rem at 50% -12%, rgb(var(--brand) / 0.14), transparent 60%)",
        }}
      />

      {/* Login card */}
      <div className="panel relative w-full max-w-sm p-6">
        {/* Logo */}
        <div className="mb-5 flex flex-col items-center gap-1 text-center">
          <span className="grid h-9 w-9 place-items-center rounded-[4px] bg-brand font-display text-[16px] font-black text-[#0a0a12]">
            N
          </span>
          <span className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">
            NUFFY
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-ink-dim">
            // цифровая коллекция
          </span>
        </div>

        <h1 className="flex items-center gap-2 font-display text-[17px] font-bold tracking-tight text-ink">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] border-1.5 border-brand" />
          Вход
        </h1>
        <p className="mt-1 text-[13px] text-ink-faint">
          Войдите, чтобы открыть инвентарь и магазин
        </p>

        {/* Form */}
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Пароль">
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" loading={loading} className="mt-1">
            Войти
          </Button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[rgb(var(--border))]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-dim">или</span>
          <span className="h-px flex-1 bg-[rgb(var(--border))]" />
        </div>

        {/* Google button */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          loading={googleLoading}
          onClick={google}
          className="w-full"
        >
          Войти через Google
        </Button>

        {/* Register link */}
        <p className="mt-4 text-center text-[13px] text-ink-faint">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-brand hover:text-brand-hover">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}