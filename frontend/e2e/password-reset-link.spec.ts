import { expect, test } from "@playwright/test";

// パスワードを忘れた利用者が、ログイン画面から再設定にたどり着けること。
//
// 再設定のページもルートも用意されているのに、ログイン画面からの導線だけが
// 無かった。URL を直接知らない利用者は永久にたどり着けない。
// Google で作ったアカウントにパスワードを足す唯一の経路でもある。
test("ログイン画面から再設定にたどり着ける", async ({ page }) => {
  await page.goto("/login");
  // SPA なので描画完了を待つ。フォームが出れば水和は済んでいる
  await expect(page.getByPlaceholder("メールアドレス")).toBeVisible();

  const link = page.locator('a[href="/forgot-password"]');
  await expect(link).toBeVisible();

  await link.click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(page.getByPlaceholder("example@example.com")).toBeVisible();
});

// 再設定コードを受け取った後、コード入力画面に進めること
test("再設定を要求すると、コード入力に進める", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("link", { name: /ログイン/ }).first()).toBeVisible();
});
