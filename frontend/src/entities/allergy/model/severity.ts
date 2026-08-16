/**
 * アレルギーの重症度。
 *
 * 表記が画面ごとに割れていた。一覧と入力フォームは「中度」、
 * 印刷用のレポートは「中等度」。同じデータが違う言葉で出ると、
 * 医療者に見せる場面で食い違いとして受け取られる。
 *
 * 「中等度」に揃える。医学的にはこちらが正式な表記で、
 * 印刷して人に渡すレポートが既にこの語を使っていた。
 */
export const ALLERGY_SEVERITY_LABELS: Record<string, string> = {
  mild: "軽度",
  moderate: "中等度",
  severe: "重度",
};

/** 入力フォームの選択肢。表示順は軽い順で固定する */
export const ALLERGY_SEVERITY_OPTIONS = Object.entries(ALLERGY_SEVERITY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

/** 表に無い値が来ても画面を壊さない。保存済みデータが増えても落ちないように */
export function allergySeverityLabel(severity: string | null | undefined): string {
  if (!severity) return "-";
  return ALLERGY_SEVERITY_LABELS[severity] ?? severity;
}
