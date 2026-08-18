"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ticket } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { requestBalanceChange } from "@/lib/actions/wallet";
import { activatePromo } from "@/lib/actions/wallet";
import { cn } from "@/lib/utils";

export function BalanceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<"deposit" | "withdraw" | "promo">("deposit");
  const [amount, setAmount] = useState("");
  const [promo, setPromo] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setAmount("");
    setPromo("");
  };

  const submit = async () => {
    if (mode === "promo") {
      if (!promo.trim()) {
        toast("Введите промокод", "warning");
        return;
      }
      setLoading(true);
      const res = await activatePromo(promo.trim().toUpperCase());
      setLoading(false);
      if (res.ok) {
        toast("Промокод активирован!", "success");
        reset();
        onClose();
        router.refresh();
      } else {
        toast(res.error ?? "Ошибка", "error");
      }
      return;
    }

    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast("Введите корректную сумму", "warning");
      return;
    }
    setLoading(true);
    const res = await requestBalanceChange(mode, value);
    setLoading(false);
    if (res.ok) {
      toast(
        mode === "deposit"
          ? "Заявка на пополнение создана"
          : "Заявка на вывод создана",
        "success"
      );
      reset();
      onClose();
      router.refresh();
    } else {
      toast(res.error ?? "Ошибка", "error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Баланс"
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button size="sm" variant="primary" loading={loading} onClick={submit}>
            {mode === "deposit" ? "Пополнить" : mode === "withdraw" ? "Вывести" : "Активировать"}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex gap-1 rounded-lg bg-base-inset p-1">
        {(["deposit", "withdraw", "promo"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              reset();
            }}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors",
              mode === m ? "bg-panel-hover text-ink" : "text-ink-faint"
            )}
          >
            {m === "deposit"
              ? "Пополнение"
              : m === "withdraw"
                ? "Вывод"
                : "Промокод"}
          </button>
        ))}
      </div>

      {mode === "promo" ? (
        <Field label="Промокод" hint="Введите код из акций NUFFY">
          <div className="relative">
            <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
            <Input
              className="pl-9 font-mono uppercase tracking-widest"
              placeholder="NUFFY100"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
        </Field>
      ) : (
        <Field label="Сумма, ₽">
          <Input
            type="number"
            min={1}
            step="0.01"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
      )}

      <p className="mt-3 text-xs leading-relaxed text-ink-faint">
        {mode === "promo"
          ? "Промокод пополняет баланс и используется один раз."
          : "Заявка создаётся в системе и обрабатывается администратором. Способ оплаты появится позже."}
      </p>
    </Modal>
  );
}