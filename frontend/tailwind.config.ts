import type { Config } from "tailwindcss";

// デザイン刷新: "Calm Wellness" — 落ち着いたエメラルド/ティール + クールニュートラル。
// アプリ全体が primary/accent/ink トークンを使うため、ここの定義が全画面に反映される。
export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // primary: エメラルド（信頼・健やかさ）
        primary: {
          DEFAULT: "#10b981",
          dark: "#059669",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        // accent: ティール（補助アクセント）
        accent: {
          DEFAULT: "#14b8a6",
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        // ink: クールニュートラル（本文・見出し）
        ink: {
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 185, 129, 0.06)",
        card: "0 1px 3px rgba(16, 24, 40, 0.06), 0 12px 32px rgba(16, 24, 40, 0.05)",
      },
    },
  },
  plugins: [],
} satisfies Config;
