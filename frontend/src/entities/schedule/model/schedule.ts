// 服薬スケジュールそのもののドメインロジック。

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const VALID_DAYS: readonly DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_MAP: Record<number, DayOfWeek> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};
const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** API 由来の曜日配列から、想定外の値を除いた曜日一覧を返す。 */
export function normalizeDays(days: string[] | null | undefined): DayOfWeek[] {
  if (!days) return [];
  return days.filter((d): d is DayOfWeek => VALID_DAYS.includes(d as DayOfWeek));
}

export interface ScheduleLike {
  daysOfWeek: string[] | null;
  intervalDays: number | null;
  startDate: string | null;
  isEnabled: boolean;
}

/** 指定日にそのスケジュールの服薬予定があるかを判定する。 */
export function isActiveOnDay(s: ScheduleLike, date: Date): boolean {
  if (!s.isEnabled) return false;
  if (s.intervalDays === -1) return false;
  if (s.intervalDays && s.intervalDays > 0 && s.startDate) {
    const start = new Date(s.startDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return false;
    return diffDays % s.intervalDays === 0;
  }
  const days = normalizeDays(s.daysOfWeek);
  if (days.length === 0) return true;
  return days.includes(DAY_MAP[date.getDay()]);
}

/** スケジュールの繰り返し条件を「毎日」「月・水・金」「21日毎」のような表示ラベルにする。 */
export function getScheduleLabel(
  daysOfWeek: readonly string[],
  intervalDays?: number | null,
): string {
  if (intervalDays === -1) return "頓服";
  if (intervalDays && intervalDays > 0) return `${intervalDays}日毎`;
  if (daysOfWeek.length === 0 || daysOfWeek.length === 7) return "毎日";
  return DAY_ORDER.filter((d) => daysOfWeek.includes(d))
    .map((d) => DAY_LABELS[d])
    .join("・");
}
