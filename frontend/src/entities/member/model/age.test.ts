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

  // 実際の入力は <input type="date"> の YYYY-MM-DD。
  // toISOString() を使うとローカル日付が UTC にずれ、本番と違う値を試すことになる
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  it("誕生日を迎えていれば満年齢", () => {
    const now = new Date();
    expect(getMemberAge(ymd(new Date(now.getFullYear() - 10, now.getMonth(), now.getDate())))).toBe(10);
  });

  it("誕生日をまだ迎えていなければ1つ引く", () => {
    const now = new Date();
    const birth = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate() + 1);
    // 月末など、翌日が翌月になる場合は境界が変わるので月内のときだけ確かめる
    if (birth.getMonth() === now.getMonth()) {
      expect(getMemberAge(ymd(birth))).toBe(9);
    }
  });

  it("未来の生年月日は null。負の年齢を表示しない", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(getMemberAge(ymd(future))).toBeNull();
  });
});

describe("暦日としての厳密な検証", () => {
  // new Date("2000-08-16") は UTC として解釈される。UTC より西の
  // タイムゾーンではローカル日付が前日になり、誕生日当日に1つ若く出る
  it("タイムゾーンで誕生日がずれない", () => {
    const original = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      const now = new Date();
      const yyyy = now.getFullYear() - 20;
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      expect(getMemberAge(`${yyyy}-${mm}-${dd}`)).toBe(20);
    } finally {
      process.env.TZ = original;
    }
  });

  // new Date は存在しない日付を翌月へ繰り上げてしまう。
  // 2024-02-30 が 2024-03-01 として通ると、入力ミスが年齢として表示される
  it.each(["2024-02-30", "2023-02-29", "2024-04-31", "2024-13-01", "2024-00-10", "2024-01-32"])(
    "暦に存在しない日付 (%s) は null",
    (value) => {
      expect(getMemberAge(value)).toBeNull();
    },
  );

  it("うるう年の 2/29 は受け付ける", () => {
    expect(getMemberAge("2024-02-29")).not.toBeNull();
  });

  it("ISO 8601 の日時形式も受け付ける", () => {
    const yyyy = new Date().getFullYear() - 30;
    expect(getMemberAge(`${yyyy}-06-15T00:00:00.000Z`)).not.toBeNull();
  });
});
