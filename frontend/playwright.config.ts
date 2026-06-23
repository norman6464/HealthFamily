import { defineConfig, devices } from "@playwright/test";

// ビルド済みSPA(build/client)を静的配信し、認証前フロー(レンダリング/クライアントルーティング/
// 保護ルートのリダイレクト/フォーム検証)を検証する。バックエンド不要で安定。
const PORT = 4173;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // E2E_BASE_URL が指定されればそこへ、無ければローカルでビルド→静的配信する
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx serve -s build/client -l ${PORT}`,
        url: BASE_URL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
