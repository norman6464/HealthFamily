import { expect, test } from "@playwright/test";

// 停止中のスケジュールが画面から分かり、その場で再開できること。
//
// 停止中は「今日の予定」に出ない。画面に区別が無かったため、薬は
// 登録されているのに予定に現れない状態から利用者が自力で戻せなかった。
const MEMBER_ID = "ece70a59-0144-4632-aebb-e38fc53a24e7";

test("停止中と分かり、その場で再開できる", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("メールアドレス").fill("ui@example.test");
  await page.getByPlaceholder("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/$|\/home/, { timeout: 15000 });

  await page.goto(`/members/${MEMBER_ID}/medications`);

  // 停止していることが分かる
  await expect(page.getByText("停止中").first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/件が停止中/)).toBeVisible();

  // その場で再開できる
  await page.getByRole("button", { name: "再開" }).click();
  await expect(page.getByRole("button", { name: "停止" })).toBeVisible({ timeout: 15000 });

  // 再開したら今日の予定に出る
  await page.goto("/");
  await expect(page.getByText("クラリチン").first()).toBeVisible({ timeout: 15000 });
});
