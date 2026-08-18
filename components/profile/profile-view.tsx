"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Check, Pencil, RotateCcw } from "lucide-react";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Panel } from "@/components/ui/misc";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { fmtAccountId, fmtDate, fmtNumber, cn } from "@/lib/utils";

export type ProfileData = {
  username: string;
  accountId: string;
  balance: number;
  createdAt: string;
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

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(data.username);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

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
      toast("Имя сохранено", "success");
      setEditing(false);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "Не удалось сохранить", "error");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Panel className="p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand/15 font-display text-xl font-bold text-brand">
              {data.username.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="max-w-[220px]"
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
                  <h1 className="font-display text-lg font-bold text-ink">{data.username}</h1>
                  <IconButton size="sm" title="Изменить имя" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-faint">
                <span>Участник с {fmtDate(data.createdAt)}</span>
                <span className="text-panel-strong">·</span>
                <button
                  className="flex items-center gap-1 font-mono text-brand hover:underline"
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
            <div className="text-right">
              <p className="text-[11px] text-ink-faint">Баланс</p>
              <p className="font-display text-xl font-bold tabular text-brand">
                {fmtNumber(Math.round(data.balance))} ₽
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Фишек в инвентаре", value: fmtNumber(data.itemsCount) },
              { label: "Активных листингов", value: fmtNumber(data.listingsCount) },
              {
                label: "Лучший предмет",
                value: data.bestChip
                  ? `${fmtNumber(Math.round(data.bestChip.base_price))} ₽`
                  : "—",
              },
              {
                label: "Лучший дроп",
                value: data.bestDrop
                  ? `${fmtNumber(Math.round(data.bestDrop.base_price))} ₽`
                  : "—",
              },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-panel-border bg-base-inset px-3 py-2.5">
                <p className="text-[11px] text-ink-faint">{s.label}</p>
                <p className="mt-0.5 text-[15px] font-semibold tabular text-ink">{s.value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-3 font-display text-sm font-bold text-ink">Лучший дроп</h2>
          {data.bestDrop ? (
            <div className="flex items-center gap-4">
              <ChipImage
                name={data.bestDrop.name}
                imageUrl={data.bestDrop.image_url}
                crop={data.bestDrop.image_crop}
                rarity={data.bestDrop.rarity.slug}
                size={72}
              />
              <div>
                <p className="text-[15px] font-semibold text-ink">{data.bestDrop.name}</p>
                <RarityBadge slug={data.bestDrop.rarity.slug} className="mt-1" />
                <p className="mt-1 tabular text-[13px] text-ink-faint">
                  {fmtNumber(Math.round(data.bestDrop.base_price))} ₽
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-ink-faint">
              Откройте паки или купите фишки — лучший дроп появится здесь
            </p>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-3 font-display text-sm font-bold text-ink">Лучший предмет в инвентаре</h2>
          {data.bestChip ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-ink">{data.bestChip.name}</p>
                <RarityBadge slug={data.bestChip.rarity.slug} className="mt-1" />
              </div>
              <p className="tabular font-display text-lg font-bold text-ink">
                {fmtNumber(Math.round(data.bestChip.base_price))} ₽
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-ink-faint">Инвентарь пуст</p>
          )}
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <Panel className="p-5">
          <h3 className="mb-2 font-display text-sm font-bold text-ink">Быстрые действия</h3>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/inventory")}
            >
              Открыть инвентарь
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/marketplace")}
            >
              На площадку
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/trades")}
            >
              Мои обмены
            </Button>
          </div>
        </Panel>
        <Panel className={cn("p-5", "bg-base-elevated/50")}>
          <h3 className="mb-2 font-display text-sm font-bold text-ink">ID аккаунта</h3>
          <p className="mb-3 text-[12px] leading-relaxed text-ink-faint">
            Нужен для пополнения баланса вручную (администратор использует его
            для зачисления средств).
          </p>
          <code className="block rounded-lg border border-panel-border bg-base-inset px-3 py-2 font-mono text-[12px] text-brand">
            {fmtAccountId(data.accountId)}
          </code>
        </Panel>
      </div>
    </div>
  );
}