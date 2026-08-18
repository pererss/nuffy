"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOutside();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onOutside]);
  return ref;
}

export function Popover({
  trigger,
  children,
  align = "left",
  width = "w-56",
}: {
  trigger: (open: boolean) => React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger(open)}</div>
      {open && (
        <div
          className={cn(
            "panel absolute z-40 mt-1.5 animate-scale-in p-1.5 shadow-modal",
            width,
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  onClick,
  children,
  danger,
  icon,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
        danger
          ? "text-danger hover:bg-danger/10"
          : "text-ink-soft hover:bg-panel-hover hover:text-ink"
      )}
    >
      {icon}
      {children}
    </button>
  );
}