"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { signIn } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(42rem 42rem at 50% -12%, rgb(var(--brand) / 0.14), transparent 60%)",
        }}
      />
      <div className="panel relative w-full max-w-sm p-8">
        <div className="mb-5 flex flex-col items-center gap-1 text-center">
          <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
            NUFFY
          </span>
          <span className="text-[10px] uppercase tracking-[0.32em] text-ink-dim">
            цифровая коллекция
          </span>
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink">
          Вход
        </h1>
        <p className="mt-1 text-[13px] text-ink-faint">
          Войдите, чтобы открыть инвентарь и магазин
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
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
        <p className="mt-5 text-center text-[13px] text-ink-faint">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-brand hover:text-brand-hover">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
