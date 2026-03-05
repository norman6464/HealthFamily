/**
 * 共通定数
 */

/** 曜日ラベル（日曜始まり、Date.getDay()のインデックスに対応） */
export const DAY_LABELS_JP = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** APIクエリのtake上限値 */
export const QUERY_LIMITS = {
  DEFAULT: 100,
  RECORDS: 5000,
  SCHEDULES: 500,
  MEMBERS: 100,
  APPOINTMENTS: 200,
} as const;
