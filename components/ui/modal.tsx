"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  actions?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof window === "undefined" || !open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={ref}
        className={cn(
          "panel relative z-10 w-full shadow-modal animate-scale-in",
          sizes[size]
        )}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-panel-border px-5 py-3.5">
            <h3 className="font-display text-[15px] font-semibold text-ink">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-ink-faint transition-colors hover:bg-panel-hover hover:text-ink"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {actions && (
          <div className="flex items-center justify-end gap-2 border-t border-panel-border px-5 py-3.5">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}