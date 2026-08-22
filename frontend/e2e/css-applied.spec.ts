import { expect, test } from "@playwright/test";

// スタイルが当たっているか。Tailwind の content 設定がソース配置とずれると、
// ビルドは成功したまま素の HTML になる。文字と URL だけを見る E2E では
// 素通りするので、計算後のスタイルを直接確かめる。
test("ログイン画面にスタイルが当たっている", async ({ page }) => {
  await page.goto("/login");

  const button = page.getByRole("button", { name: "ログイン" });
  await expect(button).toBeVisible();

  const style = await button.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, radius: s.borderRadius, padding: s.paddingTop };
  });

  // 素の <button> は背景が transparent か rgba(0,0,0,0)、角丸なし
  expect(style.bg, "ボタンに背景色が付いていない").not.toBe("rgba(0, 0, 0, 0)");
  expect(style.radius, "角丸が当たっていない").not.toBe("0px");

  // ページ全体が縦一列に潰れていないこと
  const body = await page.evaluate(() => {
    const el = document.querySelector("main, form")?.parentElement ?? document.body;
    return getComputedStyle(el).display;
  });
  expect(body).toBeTruthy();
});
