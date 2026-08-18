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
        base: {
          DEFAULT: "#0B0D11",
          elevated: "#101319",
          inset: "#0A0C0F",
        },
        panel: {
          DEFAULT: "#141820",
          hover: "#191E28",
          border: "#202634",
          strong: "#2A3142",
        },
        ink: {
          DEFAULT: "#E9EBF0",
          soft: "#B4BCC9",
          faint: "#7C8595",
          dim: "#4E5665",
        },
        brand: {
          DEFAULT: "#F0B93B",
          hover: "#FFCB5C",
          muted: "#F0B93B14",
          border: "#F0B93B38",
        },
        ok: {
          DEFAULT: "#3DD68C",
          muted: "#3DD68C14",
          border: "#3DD68C38",
        },
        warn: {
          DEFAULT: "#F0875B",
          muted: "#F0875B14",
          border: "#F0875B38",
        },
        danger: {
          DEFAULT: "#F25F66",
          muted: "#F25F6614",
          border: "#F25F6638",
        },
        info: {
          DEFAULT: "#58A6E8",
          muted: "#58A6E814",
          border: "#58A6E838",
        },
        rarity: {
          common: "#A8AFBB",
          uncommon: "#47D38C",
          rare: "#4FB3F0",
          epic: "#A97CF8",
          legendary: "#F5C651",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-manrope)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)",
        modal: "0 8px 40px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(240,185,59,0.35), 0 0 24px rgba(240,185,59,0.12)",
        "glow-lg": "0 0 0 1px rgba(240,185,59,0.45), 0 0 48px rgba(240,185,59,0.18)",
      },
      borderRadius: {
        panel: "10px",
        card: "12px",
        pill: "999px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.18s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
        "slide-in-right": "slide-in-right 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;