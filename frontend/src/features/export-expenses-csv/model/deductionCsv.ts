import type { Expense, Member } from "@/shared/api";

// 国税庁「医療費控除の明細書」風の区分にカテゴリをマッピング
const TAX_DIVISION: Record<string, string> = {
  hospital: "診療・治療",
  checkup: "診療・治療",
  medication: "医薬品購入",
  pharmacy: "医薬品購入",
  transport: "その他の医療費",
  insurance: "その他の医療費",
  pet: "その他の医療費",
  other: "その他の医療費",
};

const CSV_HEADER = [
  "医療を受けた人",
  "支払先",
  "医療費の区分",
  "支払った金額",
  "支払日",
  "控除対象",
];

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** 医療費控除の明細書(CSV)を組み立てる。 */
export function buildDeductionCsv(expenses: Expense[], members: Member[]): string {
  const memberNameMap = new Map<string, string>();
  for (const mem of members) memberNameMap.set(mem.id, mem.name);

  const rows = expenses.map((e) => [
    e.memberId ? (memberNameMap.get(e.memberId) ?? "") : "世帯",
    e.description ?? "",
    TAX_DIVISION[e.category] ?? "その他の医療費",
    String(e.amount),
    e.expenseDate.slice(0, 10),
    e.isDeductible ? "対象" : "対象外",
  ]);

  return [CSV_HEADER, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}

/** 明細書CSVを生成してダウンロードさせる。 */
export function downloadDeductionCsv(
  expenses: Expense[],
  members: Member[],
  year: number,
): void {
  if (expenses.length === 0) return;
  const csv = buildDeductionCsv(expenses, members);
  // Excel での文字化け防止に UTF-8 BOM を付与
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `医療費控除明細書_${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
