import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Maison Blanche パレット (洗練・エレガント・優美) を基調とした配色
        // primary: ダスティピンク系 (E8D4DC を中心に展開)
        primary: {
          50: '#fbf6f7',
          100: '#f7eef1',
          200: '#f2e6e6',
          300: '#e8d4dc',
          400: '#d8b8c5',
          500: '#c094a4',
          600: '#a07485',
          700: '#7d5b6a',
          800: '#5a4250',
          900: '#3d2c37',
        },
        // accent: セージミント系 (D4E2E2 を中心に展開)
        accent: {
          50: '#f5f9f9',
          100: '#eaf2f2',
          200: '#d4e2e2',
          300: '#b9cfcf',
          400: '#94b3b3',
          500: '#6f9494',
          600: '#557777',
          700: '#445e5e',
          800: '#374a4a',
          900: '#283434',
        },
        // ink: 落ち着いた本文/見出し色 (黒すぎず女性的な暗色)
        ink: {
          400: '#a0939a',
          500: '#7a6b73',
          600: '#5e4f57',
          700: '#473b41',
          800: '#33282d',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
