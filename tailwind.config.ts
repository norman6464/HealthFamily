import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        navy: {
          50: '#eef0f7',
          100: '#d6dbe8',
          200: '#a9b2cd',
          300: '#7886ad',
          400: '#4a5a8a',
          500: '#2a3866',
          600: '#1d2a52',
          700: '#161f3f',
          800: '#0e1530',
          900: '#070b1e',
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
