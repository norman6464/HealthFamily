import { describe, expect, it } from "vitest";
import {
  ALLERGY_SEVERITY_LABELS,
  ALLERGY_SEVERITY_OPTIONS,
  allergySeverityLabel,
} from "./severity";

describe("アレルギーの重症度", () => {
  it("画面をまたいで同じ表記になる", () => {
    expect(ALLERGY_SEVERITY_LABELS.moderate).toBe("中等度");
  });

  it("選択肢は軽い順", () => {
    expect(ALLERGY_SEVERITY_OPTIONS.map((o) => o.value)).toEqual([
      "mild",
      "moderate",
      "severe",
    ]);
  });

  it("未設定は - で表す", () => {
    expect(allergySeverityLabel(null)).toBe("-");
    expect(allergySeverityLabel(undefined)).toBe("-");
  });

  // 表に無い値で画面が壊れないこと。保存済みデータの種類が増えても落ちない
  it("知らない値はそのまま返す", () => {
    expect(allergySeverityLabel("unknown")).toBe("unknown");
  });
});
