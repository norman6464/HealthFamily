import { test, expect, type Page } from "@playwright/test";

// 認証付きE2E。バックエンド無しでも安定して回せるよう、トークンを注入し /api/** をモックする。
// （実バックエンドに対して回す場合は POST /auth/test-login バイパス(E2E_TEST_LOGIN_SECRET)を使う運用も可能）

const TEST_USER = {
  id: "e2e-user",
  email: "e2e@example.com",
  displayName: "E2Eユーザー",
  characterType: "cat",
  characterName: null,
  emailVerified: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

async function setupAuth(page: Page) {
  // アプリ読込前にトークンを仕込む
  await page.addInitScript(() => {
    window.localStorage.setItem("hf_token", "e2e-test-token");
  });
  // /api/** をモック（URLに応じて適切な形を返す）
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const json = (data: unknown) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data }) });
    if (url.includes("/users/me")) return json(TEST_USER);
    if (url.includes("/dashboard-preferences")) return json({ userId: TEST_USER.id, hiddenCards: [], cardOrder: [], defaultMemberId: null });
    if (url.includes("/budget/alert")) return json({ overBudget: false, monthTotal: 0, monthlyAmount: 0, overCategories: [], emailSent: false });
    if (/\/budget(\?|$)/.test(url)) return json({ id: "b1", userId: TEST_USER.id, monthlyAmount: 0, alertEnabled: true, lastAlertedMonth: null, categories: [] });
    if (url.includes("/expenses/summary")) return json({ year: 2026, total: 0, deductibleTotal: 0, byCategory: {}, byMonth: [], regularDeduction: 0, selfMedicationDeduction: 0, recommendedScheme: "none" });
    // それ以外（一覧系）は空配列
    return json([]);
  });
}

test.describe("認証付きフロー", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test("ログイン済みならホーム(ダッシュボード)が表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    // _authed レイアウトのナビ（サイドバー）が出る
    await expect(page.getByRole("link", { name: "ホーム" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
  });

  test("メンバー画面に遷移できる(認証維持)", async ({ page }) => {
    await page.goto("/members");
    await expect(page).toHaveURL(/\/members$/);
    await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
  });

  test("医療費・家計画面に遷移できる(認証維持)", async ({ page }) => {
    await page.goto("/expenses");
    await expect(page).toHaveURL(/\/expenses$/);
    await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
  });

  test("ログアウトでログイン画面に戻る", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
