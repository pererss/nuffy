"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Check, X, Copy, ExternalLink } from "lucide-react";
import { ChipImage } from "@/components/chips/chip-image";
import { RarityBadge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Field } from "@/components/ui/form";
import { Panel, PanelHeader, EmptyState, Price } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { acceptTrade, getTradeByCode, cancelTrade } from "@/lib/actions/trades";
import { fmtDate, cn } from "@/lib/utils";
import type { ChipWithMeta, InventoryRow, Trade } from "@/lib/types";

type Offer = {
  trade: Trade;
  items: Array<{ instance_id: string; serial: number; chip: ChipWithMeta }>;
  wants: ChipWithMeta[];
  initiatorName: string;
};

export function TradesView({
  trades,
  owned,
  usernames,
  myId,
}: {
  trades: Array<{ trade: Trade; items: Array<{ instance_id: string; serial: number; chip: ChipWithMeta }> }>;
  owned: InventoryRow[];
  usernames: Record<string, string>;
  myId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const find = async () => {
    if (!code.trim()) { toast("Введите код обмена", "warning"); return; }
    setLoading(true);
    const res = await getTradeByCode(code);
    setLoading(false);
    if (res.ok && res.data) { setOffer(res.data); setSelected([]); }
    else toast(res.ok ? "Не найдено" : res.error, "error");
  };

  const canAccept = offer && offer.items.filter((i) => i.instance_id !== null).length === selected.length && selected.every((id) => owned.some((i) => i.id === id));

  const submit = async () => {
    if (!offer || !canAccept) return;
    setLoading(true);
    const res = await acceptTrade(offer.trade.code, selected);
    setLoading(false);
    if (res.ok) { toast("Обмен выполнен!", "success"); setOffer(null); setCode(""); router.refresh(); }
    else toast(res.error, "error");
  };

  const cancel = async (id: string) => {
    setLoading(true);
    const res = await cancelTrade(id);
    setLoading(false);
    if (res.ok) { toast("Обмен отменён", "success"); router.refresh(); }
    else toast(res.error, "error");
  };

  const offerItems = offer?.items.filter((i) => i.instance_id !== null) ?? [];
  const offerWants = offer?.wants ?? [];
  const isMine = !!offer?.trade.initiator_id && offer.trade.initiator_id === myId;

  return (
    <div className="page-enter grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        {/* Accept trade */}
        <Panel className="p-4">
          <h2 className="mb-1 font-display text-[15px] font-bold tracking-tight text-ink">Принять обмен</h2>
          <p className="mb-3 text-[11px] text-ink-faint">Вставьте код обмена от друга</p>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Код, например AB3K9"
              className="font-mono tracking-widest h-9 text-[13px]"
              onKeyDown={(e) => e.key === "Enter" && find()}
            />
            <Button variant="primary" loading={loading} onClick={find} className="gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Найти
            </Button>
          </div>

          {offer && (
            <div className="mt-4 rounded-[6px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink">
                  Предложение от <span className="text-brand">{offer.initiatorName}</span>
                </p>
                {offer.trade.initiator_id !== offer.trade.partner_id && (
                  <IconButton title="Закрыть" size="sm" onClick={() => setOffer(null)}>
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                )}
              </div>

              {offer.trade.initiator_id && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[10px] text-ink-faint uppercase tracking-wider">Получаете ({offerItems.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {offerItems.map((i) => (
                        <div key={i.instance_id} className="relative" title={i.chip.name}>
                          <ChipImage name={i.chip.name} imageUrl={i.chip.image_url} crop={i.chip.image_crop} rarity={i.chip.rarity.slug} size={52} />
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-[rgb(var(--surface-2))] px-1 text-[8px] font-semibold tabular text-ink-soft">
                            №{i.serial}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] text-ink-faint uppercase tracking-wider">Отдаёте ({offerWants.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {offerWants.map((c) => (
                        <div key={c.id} title={`${c.name} · ${c.rarity.name}`}>
                          <ChipImage name={c.name} imageUrl={c.image_url} crop={c.image_crop} rarity={c.rarity.slug} size={52} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="mb-2 text-[11px] text-ink-faint">Выберите {offerItems.length} фишек из инвентаря:</p>
                {offerItems.length === 0 ? (
                  <EmptyState title="Пустое предложение" description="В этом обмене нет фишек" />
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {owned.map((i) => {
                      const isSel = selected.includes(i.id);
                      return (
                        <button
                          key={i.id}
                          onClick={() => setSelected((s) => isSel ? s.filter((x) => x !== i.id) : s.length < offerItems.length ? [...s, i.id] : s)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-[4px] border p-2 text-left transition-colors",
                            isSel ? "border-[rgb(var(--brand-border))] bg-brand/10" : "border-[rgb(var(--border))] hover:border-[rgb(var(--border-strong))]"
                          )}
                        >
                          <ChipImage name={i.chip_name} imageUrl={i.image_url} crop={i.image_crop} rarity={i.rarity_slug} size={32} />
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-ink">{i.chip_name}</p>
                            <p className="text-[9px] tabular text-ink-faint">№{i.serial}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <Button className="mt-3 w-full justify-center" variant="primary" loading={loading} disabled={!canAccept} onClick={submit}>
                  <Check className="h-3.5 w-3.5" />
                  Принять обмен
                </Button>
              </div>
            </div>
          )}
        </Panel>

        {/* My trades */}
        <Panel>
          <PanelHeader title="Мои обмены" />
          {trades.length === 0 ? (
            <div className="p-4"><EmptyState title="Обменов пока нет" description="Создайте обмен из инвентаря" /></div>
          ) : (
            <div className="divide-y divide-[rgb(var(--border))]">
              {trades.map(({ trade, items }) => {
                const mine = trade.initiator_id === myId;
                const partnerName = trade.partner_id ? usernames[trade.partner_id] : null;
                return (
                  <div key={trade.id} className="flex flex-col gap-1.5 px-3.5 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] tracking-widest text-brand">{trade.code}</span>
                        <IconButton title="Скопировать" size="sm" onClick={() => { navigator.clipboard.writeText(trade.code); toast("Код скопирован", "success"); }} className="h-6 w-6">
                          <Copy className="h-3 w-3" />
                        </IconButton>
                        <span className="text-[10px] text-ink-faint">
                          {trade.status === "pending" ? (mine ? "ждёт партнёра" : "ждут вашего ответа") : "отменён"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-ink-faint">{fmtDate(trade.created_at)}</span>
                        {trade.status === "pending" && mine && (
                          <Button variant="ghost" size="sm" loading={loading} onClick={() => cancel(trade.id)} className="h-6 px-2 text-[11px]">
                            Отменить
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {items.filter((i) => i.instance_id !== null).slice(0, 4).map((i) => (
                        <ChipImage key={i.instance_id} name={i.chip.name} imageUrl={i.chip.image_url} crop={i.chip.image_crop} rarity={i.chip.rarity.slug} size={36} />
                      ))}
                      {items.filter((i) => i.instance_id !== null).length > 4 && (
                        <span className="text-[10px] text-ink-faint">+{items.length - 4}</span>
                      )}
                      <ExternalLink className="ml-1 h-3 w-3 text-ink-dim cursor-pointer" onClick={() => { setCode(trade.code); find(); }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4">
        <Panel className="p-4">
          <h3 className="mb-2 font-display text-[13px] font-bold tracking-tight text-ink">Как это работает</h3>
          <ul className="flex flex-col gap-1.5 text-[11px] text-ink-soft">
            <li>1. В инвентаре выберите фишки и нажмите «Предложить обмен»</li>
            <li>2. Укажите, что хотите получить</li>
            <li>3. Отправьте код другу</li>
            <li>4. Друг отдаёт свои фишки (любые, счёт по количеству)</li>
          </ul>
        </Panel>
        <Panel className="p-4">
          <h3 className="mb-2 font-display text-[13px] font-bold tracking-tight text-ink">Условия</h3>
          <ul className="flex flex-col gap-1.5 text-[11px] text-ink-soft">
            <li>Обмен переносит lock фишки</li>
            <li>Фишки из lock и с площадки участвовать не могут</li>
            <li>Отменить можно пока обмен не принят</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}