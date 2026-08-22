import { expect, test } from "@playwright/test";

// 予定に出ない薬を一覧から気づけること。
//
// 停止中や時刻未設定の薬は「今日の予定」に出ない。カード単位のバッジだけだと
// 薬が増えるほど見落とすので、先頭でまとめて知らせる。
test.use({ viewport: { width: 390, height: 844 } });

test("予定に出ない薬が先頭でまとめて分かる", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("メールアドレス").fill("ui2@example.test");
  await page.getByPlaceholder("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/$|\/home/, { timeout: 15000 });

  await page.goto("/medications");
  await expect(page.getByText("ステロップ").first()).toBeVisible({ timeout: 15000 });

  // 何件がなぜ出ないのかが分かる
  const banner = page.getByText(/件の薬は今日の予定に出ません/);
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("ステロップ");

  // 時刻のバッジも停止中と分かる
  await expect(page.getByText("停止中").first()).toBeVisible();
});
