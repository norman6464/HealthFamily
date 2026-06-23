import { test, expect } from "@playwright/test";

test.describe("SPAルーティング", () => {
  test("サインアップへ直接アクセスできる(SPAフォールバック)", async ({ page }) => {
    const res = await page.goto("/signup");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();
  });

  test("サインアップからログインへ戻れる", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: "ログインへ戻る" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("医師共有レポートは未ログインだとログインへ", async ({ page }) => {
    await page.goto("/members/demo-id/report");
    await expect(page).toHaveURL(/\/login$/);
  });
});
