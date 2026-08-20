"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { useSound } from "@/components/sound";
import { adminUpdateSettings } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

type SettingsFormData = {
  system: {
    sell_lock_days: number;
    shop_enabled: boolean;
    marketplace_enabled: boolean;
    trades_enabled: boolean;
    upgrades_enabled: boolean;
  };
  marketplace: { fee_percent: number };
  economy: { upgrade_source_multiplier: number };
};

function FlagSwitch({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-3 rounded-[4px] border border-[rgb(var(--border))] px-3 py-2 text-left transition-colors hover:border-[rgb(var(--border-strong))]"
    >
      <span>
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-ink-faint">{hint}</span>
      </span>
      <span
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors",
          value ? "justify-end border-[rgb(var(--brand-border))] bg-brand/15" : "justify-start border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))]"
        )}
      >
        <span className={cn("h-4 w-4 rounded-full transition-colors", value ? "bg-brand" : "bg-ink-dim")} />
      </span>
    </button>
  );
}

export function SettingsForm({ initial }: { initial: SettingsFormData }) {
  const { toast } = useToast();
  const { play } = useSound();
  const [form, setForm] = useState<SettingsFormData>(initial);
  const [saving, setSaving] = useState(false);

  const setSystem = (patch: Partial<SettingsFormData["system"]>) =>
    setForm((f) => ({ ...f, system: { ...f.system, ...patch } }));

  const save = async () => {
    setSaving(true);
    const res = await adminUpdateSettings(form.system, form.marketplace, form.economy);
    setSaving(false);
    if (res.ok) {
      play("success");
      toast("Настройки сохранены", "success");
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <PanelHeader
          title="Система"
          right={<span className="text-[10px] text-ink-faint">применяется мгновенно</span>}
        />
        <div className="flex flex-col gap-4 p-4">
          <Field label="Lock-период продажи, дней" hint="0 — без блокировки (до 30)">
            <Input
              type="number"
              min={0}
              max={30}
              value={form.system.sell_lock_days}
              onChange={(e) => setSystem({ sell_lock_days: parseInt(e.target.value) || 0 })}
            />
          </Field>
          <div className="flex flex-col gap-1.5">
            <FlagSwitch
              label="Магазин"
              hint="Покупка фишек и паков"
              value={form.system.shop_enabled}
              onChange={(v) => setSystem({ shop_enabled: v })}
            />
            <FlagSwitch
              label="Торговая площадка"
              hint="Покупка листингов"
              value={form.system.marketplace_enabled}
              onChange={(v) => setSystem({ marketplace_enabled: v })}
            />
            <FlagSwitch
              label="Обмены"
              hint="Создание и принятие обменов"
              value={form.system.trades_enabled}
              onChange={(v) => setSystem({ trades_enabled: v })}
            />
            <FlagSwitch
              label="Апгрейды"
              hint="Апгрейд-механика"
              value={form.system.upgrades_enabled}
              onChange={(v) => setSystem({ upgrades_enabled: v })}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Экономика" />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Комиссия площадки, %" hint="удерживается с продавца">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.marketplace.fee_percent}
              onChange={(e) =>
                setForm((f) => ({ ...f, marketplace: { fee_percent: parseFloat(e.target.value) || 0 } }))
              }
            />
          </Field>
          <Field label="Множитель источника апгрейда" hint="стоимость сжигаемой × множитель">
            <Input
              type="number"
              min={0}
              max={1}
              step="0.01"
              value={form.economy.upgrade_source_multiplier}
              onChange={(e) =>
                setForm((f) => ({ ...f, economy: { upgrade_source_multiplier: parseFloat(e.target.value) || 0 } }))
              }
            />
          </Field>
        </div>
      </Panel>

      <div className="flex items-center gap-3">
        <Button variant="primary" loading={saving} onClick={save} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          Сохранить настройки
        </Button>
        <span className="text-[11px] text-ink-faint">
          Изменения применяются сразу
        </span>
      </div>
    </div>
  );
}
