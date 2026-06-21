import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7c9cbf",
          dark: "#5d7da0",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
