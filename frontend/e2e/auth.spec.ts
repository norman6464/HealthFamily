import { test, expect } from "@playwright/test";

test.describe("認証前フロー", () => {
  test("ログイン画面が表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "HealthFamily" })).toBeVisible();
    await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();
    await expect(page.getByPlaceholder("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("新規登録画面へ遷移できる", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "新規登録" }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();
  });

  test("未ログインで保護ルートに来るとログインへリダイレクトされる", async ({ page }) => {
    await page.goto("/expenses");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("未ログインでホームに来るとログインへリダイレクトされる", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});
