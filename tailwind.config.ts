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
        bg: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)",
          elevated: "rgb(var(--surface) / <alpha-value>)",
          inset: "rgb(var(--surface-2) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          hover: "rgb(var(--surface-hover) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
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
          muted: "rgb(var(--brand) / 0.12)",
          border: "rgb(var(--brand) / 0.4)",
        },
        ok: {
          DEFAULT: "rgb(var(--ok) / <alpha-value>)",
          muted: "rgb(var(--ok) / 0.12)",
          border: "rgb(var(--ok) / 0.38)",
        },
        warn: {
          DEFAULT: "rgb(var(--warn) / <alpha-value>)",
          muted: "rgb(var(--warn) / 0.12)",
          border: "rgb(var(--warn) / 0.38)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          muted: "rgb(var(--danger) / 0.12)",
          border: "rgb(var(--danger) / 0.38)",
        },
        info: {
          DEFAULT: "rgb(var(--info) / <alpha-value>)",
          muted: "rgb(var(--info) / 0.12)",
          border: "rgb(var(--info) / 0.38)",
        },
        rarity: {
          common: "#9AA1AC",
          uncommon: "#3FB47E",
          rare: "#3E8FD0",
          epic: "#9A6FE0",
          legendary: "#E0B23C",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-manrope)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(58,44,28,0.05), 0 12px 32px -14px rgba(58,44,28,0.18)",
        cardHover: "0 2px 6px rgba(58,44,28,0.07), 0 20px 44px -16px rgba(58,44,28,0.26)",
        modal: "0 26px 64px -16px rgba(40,30,20,0.32)",
        glow: "0 0 0 1px rgb(var(--brand) / 0.4), 0 0 26px rgb(var(--brand) / 0.16)",
        "glow-lg": "0 0 0 1px rgb(var(--brand) / 0.45), 0 0 52px rgb(var(--brand) / 0.22)",
      },
      borderRadius: {
        panel: "14px",
        card: "16px",
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
      },
      animation: {
        "fade-up": "fade-up 0.22s ease-out",
        "fade-in": "fade-in 0.16s ease-out",
        "scale-in": "scale-in 0.18s ease-out",
        "slide-in-right": "slide-in-right 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
