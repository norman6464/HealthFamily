import type { Config } from "tailwindcss";

// 旧 Next.js 版の「Maison Blanche」パレット（エレガント・優美）を踏襲
// ブランド/テーマカラー = ダスティピンク #e8d4dc、アクセント = セージミント
export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // primary: ダスティピンク系（タブのテーマカラー #e8d4dc を中心に展開）
        primary: {
          DEFAULT: "#c094a4",
          dark: "#a07485",
          50: "#fbf6f7",
          100: "#f7eef1",
          200: "#f2e6e6",
          300: "#e8d4dc",
          400: "#d8b8c5",
          500: "#c094a4",
          600: "#a07485",
          700: "#7d5b6a",
          800: "#5a4250",
          900: "#3d2c37",
        },
        // accent: セージミント系
        accent: {
          DEFAULT: "#94b3b3",
          50: "#f5f9f9",
          100: "#eaf2f2",
          200: "#d4e2e2",
          300: "#b9cfcf",
          400: "#94b3b3",
          500: "#6f9494",
          600: "#557777",
          700: "#445e5e",
          800: "#374a4a",
          900: "#283434",
        },
        // ink: 落ち着いた本文/見出し色
        ink: {
          400: "#a0939a",
          500: "#7a6b73",
          600: "#5e4f57",
          700: "#473b41",
          800: "#33282d",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
