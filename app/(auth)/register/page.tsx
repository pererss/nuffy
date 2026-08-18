"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { signUp } from "@/lib/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().replace(/\s+/g, "_").slice(0, 32);
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      toast("Username: только латиница, цифры и _", "warning");
      return;
    }
    if (password.length < 6) {
      toast("Пароль должен быть не короче 6 символов", "warning");
      return;
    }
    if (password !== password2) {
      toast("Пароли не совпадают", "warning");
      return;
    }
    setLoading(true);
    const res = await signUp(email.trim().toLowerCase(), password, clean);
    setLoading(false);
    if (res.ok) {
      setCreated(true);
    } else {
      toast(res.error, "error");
    }
  };

  if (created) {
    return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(42rem 42rem at 50% -12%, rgb(var(--brand) / 0.14), transparent 60%)",
        }}
      />
      <div className="panel relative w-full max-w-sm p-8 text-center">
        <div className="mb-4 flex flex-col items-center gap-1">
          <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
            NUFFY
          </span>
          <span className="text-[10px] uppercase tracking-[0.32em] text-ink-dim">
            цифровая коллекция
          </span>
        </div>
        <h1 className="font-display text-xl font-bold text-ink">Почти готово</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Мы отправили письмо на указанный email. Подтвердите адрес, затем
            войдите в аккаунт.
          </p>
          <Button
            className="mt-6 w-full"
            variant="primary"
            onClick={() => router.push("/login")}
          >
            Перейти ко входу
          </Button>
        </div>
      </div>
    );
  }

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
          Регистрация
        </h1>
        <p className="mt-1 text-[13px] text-ink-faint">
          Создайте аккаунт — ваш ID присвоится автоматически
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <Field label="Username">
            <Input
              required
              autoComplete="username"
              placeholder="nuffy_user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
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
              autoComplete="new-password"
              placeholder="минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Повторите пароль">
            <Input
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" loading={loading} className="mt-1">
            Создать аккаунт
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px] text-ink-faint">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-brand hover:text-brand-hover">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
