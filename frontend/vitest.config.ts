import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// ユニットテストは Vite のビルド設定とは切り離す。
// React Router のプラグインを噛ませると型生成が必要になり、テストが重くなるため。
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    // オリジンを与えないと localStorage が生えず、同一オリジン判定も検証できない
    environmentOptions: { jsdom: { url: "https://app.example" } },
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
  },
});
