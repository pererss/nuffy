import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)",
          elevated: "rgb(var(--surface) / <alpha-value>)",
          inset: "rgb(var(--surface-2) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          hover: "rgb(var(--surface-hover) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          3: "rgb(var(--surface-3) / <alpha-value>)",
        },
        panel: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          hover: "rgb(var(--surface-hover) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
          dim: "rgb(var(--ink-dim) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          hover: "rgb(var(--brand-hover) / <alpha-value>)",
          muted: "rgb(var(--brand-muted))",
          border: "rgb(var(--brand-border))",
          glow: "rgb(var(--brand-glow))",
        },
        ok: {
          DEFAULT: "rgb(var(--ok) / <alpha-value>)",
          muted: "rgb(var(--ok-muted))",
          border: "rgb(var(--ok) / 0.38)",
        },
        warn: {
          DEFAULT: "rgb(var(--warn) / <alpha-value>)",
          muted: "rgb(var(--warn-muted))",
          border: "rgb(var(--warn) / 0.38)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          muted: "rgb(var(--danger-muted))",
          border: "rgb(var(--danger) / 0.38)",
        },
        info: {
          DEFAULT: "rgb(var(--info) / <alpha-value>)",
          muted: "rgb(var(--info-muted))",
          border: "rgb(var(--info) / 0.38)",
        },
        rarity: {
          common: "rgb(var(--rarity-common))",
          uncommon: "rgb(var(--rarity-uncommon))",
          rare: "rgb(var(--rarity-rare))",
          epic: "rgb(var(--rarity-epic))",
          legendary: "rgb(var(--rarity-legendary))",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.15), 0 8px 24px -8px rgba(0,0,0,0.3)",
        cardHover: "0 2px 4px rgba(0,0,0,0.15), 0 14px 36px -10px rgba(0,0,0,0.4)",
        modal: "0 20px 56px -12px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgb(var(--brand) / 0.25), 0 0 20px rgb(var(--brand) / 0.12)",
        "glow-lg": "0 0 0 1px rgb(var(--brand) / 0.3), 0 0 40px rgb(var(--brand) / 0.18)",
      },
      borderRadius: {
        panel: "6px",
        card: "8px",
        pill: "999px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(14px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "page-enter": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "skeleton-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.22s ease-out",
        "fade-in": "fade-in 0.16s ease-out",
        "scale-in": "scale-in 0.18s ease-out",
        "slide-in-right": "slide-in-right 0.2s ease-out",
        "page-enter": "page-enter 0.2s ease-out",
        "skeleton-shimmer": "skeleton-shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
