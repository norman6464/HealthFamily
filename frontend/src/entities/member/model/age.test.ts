import { describe, expect, it } from "vitest";
import { getMemberAge } from "./age";

describe("メンバーの年齢", () => {
  it("生年月日が未設定なら null", () => {
    expect(getMemberAge(null)).toBeNull();
  });

  it("空文字も null として扱う", () => {
    expect(getMemberAge("")).toBeNull();
  });

  // 日付として読めない値で NaN を返すと、呼び出し側の null 判定を素通りして
  // 画面に「NaN歳」と出る。実際にそう表示されていた
  it.each(["not-a-date", "2026-13-45", "0000-00-00", "abc"])(
    "日付として読めない値 (%s) は null",
    (value) => {
      expect(getMemberAge(value)).toBeNull();
    },
  );

  it("誕生日を迎えていれば満年齢", () => {
    const now = new Date();
    const birth = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    expect(getMemberAge(birth.toISOString())).toBe(10);
  });

  it("誕生日をまだ迎えていなければ1つ引く", () => {
    const now = new Date();
    const birth = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate() + 1);
    // 月末など、翌日が翌月になる場合は境界が変わるので月内のときだけ確かめる
    if (birth.getMonth() === now.getMonth()) {
      expect(getMemberAge(birth.toISOString())).toBe(9);
    }
  });

  it("未来の生年月日は null。負の年齢を表示しない", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(getMemberAge(future.toISOString())).toBeNull();
  });
});
