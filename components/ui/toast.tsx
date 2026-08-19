"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/components/sound";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void;
}>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { play } = useSound();

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++toastId;
      setToasts((t) => [...t, { id, type, message }]);
      play(type === "success" ? "success" : type === "error" ? "error" : "click");
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 4500);
    },
    [play]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-ok" />,
    error: <XCircle className="h-4 w-4 text-danger" />,
    warning: <AlertTriangle className="h-4 w-4 text-warn" />,
    info: <Info className="h-4 w-4 text-info" />,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof window !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "pointer-events-auto flex items-start gap-2.5 overflow-hidden rounded-[8px] border border-panel-border bg-panel px-3.5 py-3 shadow-modal animate-slide-in-right",
                  "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px]",
                  t.type === "success" && "before:bg-ok",
                  t.type === "error" && "before:bg-danger",
                  t.type === "warning" && "before:bg-warn",
                  t.type === "info" && "before:bg-info"
                )}
              >
                <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
                <p className="text-[13px] leading-snug text-ink-soft">{t.message}</p>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
