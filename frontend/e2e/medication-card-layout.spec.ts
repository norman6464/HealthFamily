import { expect, test } from "@playwright/test";

// スマホ幅で薬カードが崩れないこと。
//
// flex-1 は既定で min-width:auto なので縮まない。右の操作列に押されて
// 薬名の列が幅ゼロ近くまで潰れ、一文字ずつ改行されていた。
test.use({ viewport: { width: 390, height: 844 } });

test("狭い画面で薬名が縦積みにならない", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("メールアドレス").fill("ui2@example.test");
  await page.getByPlaceholder("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL(/\/$|\/home/, { timeout: 15000 });

  await page.goto("/medications");
  const name = page.getByText("ステロップ").first();
  await expect(name).toBeVisible({ timeout: 15000 });

  const box = await name.boundingBox();
  expect(box).not.toBeNull();

  // 5文字が縦に積まれると高さが 100px を超え、幅は 30px 程度になる。
  // 1行で収まっていれば高さは 1行分、幅は文字数ぶん出る
  expect(box!.height, `薬名が縦積みになっている (h=${box!.height})`).toBeLessThan(60);
  expect(box!.width, `薬名の幅が潰れている (w=${box!.width})`).toBeGreaterThan(60);
});

// 広い画面では従来どおり横並びのままであること
test.describe("広い画面", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("薬名と操作が同じ行に並ぶ", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("メールアドレス").fill("ui2@example.test");
    await page.getByPlaceholder("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    await expect(page).toHaveURL(/\/$|\/home/, { timeout: 15000 });

    await page.goto("/medications");
    const name = page.getByText("ステロップ").first();
    await expect(name).toBeVisible({ timeout: 15000 });

    const nameBox = await name.boundingBox();
    const del = page.getByRole("button", { name: "削除" }).first();
    const delBox = await del.boundingBox();

    // 縦積みになっていれば、削除ボタンは薬名よりずっと下に来る
    expect(Math.abs(nameBox!.y - delBox!.y), "広い画面で行が分かれている").toBeLessThan(60);
  });
});
