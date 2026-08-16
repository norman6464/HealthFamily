/**
 * カテゴリのラベル定義を集約。
 * 複数コンポーネントで重複していたラベルマップを一元化している。
 */

import type { ExpenseCategory } from "@/shared/api";

export type MedicationCategory =
  | "regular"
  | "supplement"
  | "prn"
  | "inhaler"
  | "eye_drops"
  | "patch"
  | "topical"
  | "flea_tick"
  | "heartworm";

export const MEDICATION_CATEGORY_LABELS: Record<MedicationCategory, string> = {
  regular: "常用薬",
  supplement: "サプリメント",
  prn: "頓服薬",
  inhaler: "吸入薬",
  eye_drops: "目薬",
  patch: "湿布",
  topical: "塗り薬",
  flea_tick: "ノミ・ダニ薬",
  heartworm: "フィラリア薬",
};

/** 薬のカテゴリ値からラベルを取得する。未知の値はそのまま返す。 */
export function getMedicationCategoryLabel(category: string): string {
  return MEDICATION_CATEGORY_LABELS[category as MedicationCategory] ?? category;
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "medication", label: "薬・処方" },
  { value: "hospital", label: "診察・治療" },
  { value: "pharmacy", label: "薬局" },
  { value: "insurance", label: "保険料" },
  { value: "checkup", label: "健診・検査" },
  { value: "pet", label: "ペット医療" },
  { value: "transport", label: "通院交通費" },
  { value: "other", label: "その他" },
];

const EXPENSE_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label]),
);

/** 医療費カテゴリ値からラベルを取得する。未知の値はそのまま返す。 */
export function getExpenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category] ?? category;
}
