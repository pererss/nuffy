"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Check, Pencil, RotateCcw, Wallet, Shield, LogOut, Volume2, VolumeX } from "lucide-react";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Panel } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useSound } from "@/components/sound";
import { BalanceModal } from "@/components/profile/balance-modal";
import { signOut } from "@/lib/actions/auth";
import { fmtAccountId, fmtDate, fmtNumber, cn } from "@/lib/utils";

export type ProfileData = {
  username: string;
  accountId: string;
  balance: number;
  createdAt: string;
  isAdmin: boolean;
  itemsCount: number;
  listingsCount: number;
  bestChip: {
    name: string;
    base_price: number;
    rarity: { slug: string; name: string; color: string };
  } | null;
  bestDrop: {
    name: string;
    base_price: number;
    image_url: string | null;
    image_crop: { x: number; y: number; zoom: number } | null;
    rarity: { slug: string; name: string; color: string };
  } | null;
};

export function ProfileView({ data }: { data: ProfileData }) {
  const router = useRouter();
  const { toast } = useToast();
  const { enabled: soundOn, toggle: toggleSound, play } = useSound();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(data.username);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const doSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  };

  const saveUsername = async () => {
    const clean = username.trim();
    if (!clean || clean.length < 3 || clean.length > 20) {
      toast("Имя должно быть от 3 до 20 символов", "warning");
      return;
    }
    if (clean === data.username) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/profile/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: clean }),
    });
    setSaving(false);
    if (res.ok) {
      play("success");
      toast("Имя сохранено", "success");
      setEditing(false);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "Не удалось сохранить", "error");
    }
  };

  return (
    <div className="page-enter grid gap-5 lg:grid-cols-3">
      {/* Main column */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        {/* Profile card */}
        <Panel className="relative overflow-hidden p-5">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(circle at 10% 0%, rgb(var(--brand) / 0.1), transparent 50%)",
            }}
          />
          <div className="relative flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[6px] bg-brand/15 font-display text-xl font-bold text-brand">
              {data.username.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="max-w-[220px] h-8 text-[13px]"
                    onKeyDown={(e) => e.key === "Enter" && saveUsername()}
                  />
                  <Button size="sm" variant="primary" loading={saving} onClick={saveUsername}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <IconButton size="sm" title="Отмена" onClick={() => { setEditing(false); setUsername(data.username); }}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-[17px] font-bold tracking-tight text-ink">{data.username}</h1>
                  <IconButton size="sm" title="Изменить имя" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-faint">
                <span>Участник с {fmtDate(data.createdAt)}</span>
                <span className="text-[rgb(var(--border-strong))]">·</span>
                <button
                  className="flex items-center gap-1 font-mono text-brand hover:underline btn-press"
                  onClick={() => {
                    navigator.clipboard.writeText(fmtAccountId(data.accountId));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  title="Скопировать ID"
                >
                  {fmtAccountId(data.accountId)}
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-ink-faint">Баланс</p>
              <p className="font-display text-xl font-bold tabular text-brand">
                {fmtNumber(Math.round(data.balance))} ₽
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative mt-4 grid grid-cols-2 gap-2">
            {[
              { label: "Фишек в инвентаре", value: fmtNumber(data.itemsCount) },
              { label: "Активных листингов", value: fmtNumber(data.listingsCount) },
            ].map((s) => (
              <div key={s.label} className="rounded-[4px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2">
                <p className="text-[10px] text-ink-faint">{s.label}</p>
                <p className="mt-0.5 text-[15px] font-semibold tabular text-ink">{s.value}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Best drop */}
        {data.bestDrop && (
          <Panel className="p-5 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <h2 className="mb-3 font-display text-[13px] font-bold tracking-[0.06em] text-ink">Лучший дроп</h2>
            <div className="flex items-center gap-4">
              <ChipImage
                name={data.bestDrop.name}
                imageUrl={data.bestDrop.image_url}
                crop={data.bestDrop.image_crop}
                rarity={data.bestDrop.rarity.slug}
                size={64}
              />
              <div>
                <p className="text-[14px] font-semibold text-ink">{data.bestDrop.name}</p>
                <RarityBadge slug={data.bestDrop.rarity.slug} className="mt-1" />
                <p className="mt-1 tabular text-[13px] text-ink-faint">
                  {fmtNumber(Math.round(data.bestDrop.base_price))} ₽
                </p>
              </div>
            </div>
          </Panel>
        )}

        {/* Best chip */}
        {data.bestChip && (
          <Panel className="p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <h2 className="mb-3 font-display text-[13px] font-bold tracking-[0.06em] text-ink">Лучший предмет</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink">{data.bestChip.name}</p>
                <RarityBadge slug={data.bestChip.rarity.slug} className="mt-1" />
              </div>
              <p className="tabular font-display text-lg font-bold text-ink">
                {fmtNumber(Math.round(data.bestChip.base_price))} ₽
              </p>
            </div>
          </Panel>
        )}
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4">
        {/* Quick actions */}
        <Panel className="p-5 animate-fade-up" style={{ animationDelay: "40ms" }}>
          <h3 className="mb-3 font-display text-[13px] font-bold tracking-[0.06em] text-ink">Быстрые действия</h3>
          <div className="flex flex-col gap-1.5">
            <Button variant="primary" size="sm" onClick={() => setBalanceOpen(true)} className="justify-start gap-2">
              <Wallet className="h-3.5 w-3.5" />
              Баланс и промокоды
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/inventory")} className="justify-start gap-2">
              Открыть инвентарь
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/marketplace")} className="justify-start gap-2">
              На площадку
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/trades")} className="justify-start gap-2">
              Мои обмены
            </Button>
          </div>
        </Panel>

        {/* Settings */}
        <Panel className="p-5 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <h3 className="mb-3 font-display text-[13px] font-bold tracking-[0.06em] text-ink">Настройки</h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => {
                toggleSound();
                if (soundOn) play("click");
              }}
              className="btn-press flex items-center justify-between rounded-[4px] border border-[rgb(var(--border))] px-3 py-2 transition-colors hover:border-[rgb(var(--border-strong))]"
            >
              <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                {soundOn ? <Volume2 className="h-3.5 w-3.5 text-brand" /> : <VolumeX className="h-3.5 w-3.5 text-ink-dim" />}
                Звуковые эффекты
              </span>
              <span
                className={cn(
                  "flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors",
                  soundOn ? "justify-end border-brand bg-brand/20" : "justify-start border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))]"
                )}
              >
                <span className={cn("h-4 w-4 rounded-full transition-colors", soundOn ? "bg-brand" : "bg-ink-dim")} />
              </span>
            </button>
            {data.isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => router.push("/admin/dashboard")} className="justify-start gap-2">
                <Shield className="h-3.5 w-3.5" />
                Админ-панель
              </Button>
            )}
            <Button variant="ghost" size="sm" loading={signingOut} onClick={doSignOut} className="justify-start gap-2 text-danger hover:bg-danger/10 hover:text-danger">
              <LogOut className="h-3.5 w-3.5" />
              Выйти
            </Button>
          </div>
        </Panel>
      </div>

      {balanceOpen && <BalanceModal open onClose={() => setBalanceOpen(false)} />}
    </div>
  );
}