"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { playSound, shouldSuppressClick, type SoundName } from "@/lib/sound/manager";

type SoundCtx = {
  enabled: boolean;
  toggle: () => void;
  play: (name: SoundName) => void;
};

const Ctx = createContext<SoundCtx>({
  enabled: true,
  toggle: () => {},
  play: () => {},
});

const STORAGE_KEY = "nuffy-sound";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "off") setEnabled(false);
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: PointerEvent) => {
      if (shouldSuppressClick()) return;
      const target = e.target as Element | null;
      if (!target || typeof target.closest !== "function") return;
      const interactive = target.closest(
        "button, a[href], select, input[type='checkbox'], input[type='radio'], [role='switch'], [role='menuitem']"
      );
      if (!interactive) return;
      const isLink = interactive.tagName === "A" && Boolean((interactive as HTMLAnchorElement).href);
      playSound(isLink ? "nav" : "click");
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {}
      return next;
    });
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (enabled) playSound(name);
    },
    [enabled]
  );

  const value = useMemo(() => ({ enabled, toggle, play }), [enabled, toggle, play]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSound() {
  return useContext(Ctx);
}