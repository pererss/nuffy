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
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="panel w-full max-w-sm p-8">
        <h1 className="font-display text-xl font-bold tracking-tight text-ink">
          Вход в NUFFY
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
