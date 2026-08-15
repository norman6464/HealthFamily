/**
 * 共通フォーマッタ。
 * 各コンポーネントで重複していた Intl.NumberFormat / toLocaleDateString を集約。
 * 出力は従来と完全に同一になるようにしている。
 */

const jpyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

/** 金額を日本円 (例: ￥1,234) で表示する。 */
export function formatCurrency(amount: number): string {
  return jpyFormatter.format(amount);
}

/** 日付を「2024年1月2日」形式で表示する。 */
export function formatDateLong(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** 日付を「2024/1/2」形式 (ロケール既定) で表示する。 */
export function formatDateShort(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("ja-JP");
}
