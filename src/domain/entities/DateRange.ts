/**
 * 日付範囲計算ヘルパー
 */

const DAY_TO_INDEX: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

export class DateRangeHelper {
  /**
   * 日付をYYYY-MM-DD形式のキーに変換
   */
  static toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 日付を0時0分0秒に正規化したコピーを返す
   */
  static toStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * 指定日数前の日付を0時0分0秒で返す
   */
  static daysAgo(days: number, from: Date = new Date()): Date {
    const date = DateRangeHelper.toStartOfDay(from);
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * スケジュールの曜日配列から曜日別の期待数を算出
   * 返り値: [日, 月, 火, 水, 木, 金, 土] の順で期待数
   */
  static calculateExpectedByDayOfWeek(schedules: { daysOfWeek: string[] }[]): number[] {
    const expected = new Array(7).fill(0);
    for (const schedule of schedules) {
      if (schedule.daysOfWeek.length === 0) {
        for (let i = 0; i < 7; i++) expected[i] += 1;
      } else {
        for (const day of schedule.daysOfWeek) {
          const index = DAY_TO_INDEX[day];
          if (index !== undefined) expected[index] += 1;
        }
      }
    }
    return expected;
  }

  /**
   * 日数から期間ラベルを生成
   */
  static getPeriodLabel(days: number): string {
    return `過去${days}日間`;
  }

  /**
   * 2つの日付間の日数差を計算（to - from）
   */
  static diffDays(from: Date, to: Date): number {
    const fromStart = DateRangeHelper.toStartOfDay(from);
    const toStart = DateRangeHelper.toStartOfDay(to);
    return Math.round((toStart.getTime() - fromStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 日付が基準日からdays日以内かどうかを判定
   */
  static isWithinDays(date: Date, reference: Date, days: number): boolean {
    return Math.abs(DateRangeHelper.diffDays(reference, date)) <= days;
  }

  /**
   * 2つの日付間の全日付キー（YYYY-MM-DD）を配列で返す
   */
  static getDatesBetween(from: Date, to: Date): string[] {
    const result: string[] = [];
    const current = DateRangeHelper.toStartOfDay(from);
    const end = DateRangeHelper.toStartOfDay(to);
    while (current <= end) {
      result.push(DateRangeHelper.toDateKey(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  /**
   * 曜日の日本語ラベルを返す
   */
  private static readonly DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
  private static readonly DAYS_IN_WEEK = 7;
  private static readonly MS_PER_DAY = 1000 * 60 * 60 * 24;
  private static readonly CLUSTER_MAX_INTERVAL = 30;
  private static readonly CLUSTER_DENSE_THRESHOLD = 70;
  private static readonly CLUSTER_MODERATE_THRESHOLD = 40;
  private static readonly SPAN_SHORT_THRESHOLD = 14;
  private static readonly SPAN_LONG_THRESHOLD = 90;
  private static readonly DENSITY_HIGH_THRESHOLD = 80;
  private static readonly DENSITY_MODERATE_THRESHOLD = 50;
  private static readonly WEEKDAY_CONCENTRATION_HIGH_THRESHOLD = 70;
  private static readonly WEEKDAY_CONCENTRATION_MODERATE_THRESHOLD = 40;
  private static readonly DATE_GAP_REGULAR_THRESHOLD = 80;
  private static readonly DATE_GAP_MODERATE_THRESHOLD = 50;
  private static readonly WEEKEND_RATIO_HIGH_THRESHOLD = 40;
  private static readonly WEEKEND_RATIO_LOW_THRESHOLD = 20;
  private static readonly DATE_SPAN_SUFFICIENT_THRESHOLD = 80;
  private static readonly DATE_SPAN_MODERATE_THRESHOLD = 50;
  private static readonly DATE_REGULARITY_MAX_CV = 100;
  private static readonly DATE_REGULARITY_HIGH_THRESHOLD = 80;
  private static readonly DATE_REGULARITY_MODERATE_THRESHOLD = 50;

  static getDayOfWeekLabel(date: Date): string {
    return DateRangeHelper.DAY_LABELS[date.getDay()];
  }

  /**
   * 曜日ラベル配列を返す（日〜土）
   */
  static getDayLabels(): string[] {
    return [...DateRangeHelper.DAY_LABELS];
  }

  /**
   * 土日かどうかを判定
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  /**
   * 年内の週番号を返す（1始まり）
   */
  static getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.ceil((days + 1) / 7);
  }

  /**
   * 開始日が終了日以前であることを検証する
   */
  static isValidDateRange(from: Date, to: Date): boolean {
    return from.getTime() <= to.getTime();
  }

  /**
   * 日付を指定範囲内に制約する
   */
  static clampDate(date: Date, min: Date, max: Date): Date {
    if (date.getTime() < min.getTime()) return min;
    if (date.getTime() > max.getTime()) return max;
    return date;
  }

  /**
   * 指定月の開始日と終了日を返す（monthは0-indexed）
   */
  static getMonthRange(year: number, month: number): { start: Date; end: Date } {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  }

  /**
   * 日付範囲を日本語でフォーマットする
   */
  static formatDateRange(start: Date, end: Date): string {
    const startStr = `${start.getMonth() + 1}月${start.getDate()}日`;
    const endStr = `${end.getMonth() + 1}月${end.getDate()}日`;
    if (startStr === endStr) return startStr;
    return `${startStr}〜${endStr}`;
  }

  /**
   * 相対日付を日本語で表示する
   */
  /**
   * 営業日（月-金）かどうかを判定する
   */
  static isBusinessDay(date: Date): boolean {
    return !DateRangeHelper.isWeekend(date);
  }

  /**
   * 期間内の営業日数を算出する（from/to含む）
   */
  static countBusinessDays(from: Date, to: Date): number {
    let count = 0;
    const current = DateRangeHelper.toStartOfDay(from);
    const end = DateRangeHelper.toStartOfDay(to);
    while (current <= end) {
      if (DateRangeHelper.isBusinessDay(current)) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  /**
   * 営業日数を加算した日付を返す
   */
  static addBusinessDays(from: Date, days: number): Date {
    const result = new Date(from);
    let added = 0;
    if (days === 0) return result;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (DateRangeHelper.isBusinessDay(result)) added++;
    }
    return result;
  }

  static formatRelativeDate(date: Date, today: Date): string {
    const startOfDate = DateRangeHelper.toStartOfDay(date);
    const startOfToday = DateRangeHelper.toStartOfDay(today);
    const diffDays = DateRangeHelper.diffDays(startOfDate, startOfToday);

    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays > 1 && diffDays <= 7) return `${diffDays}日前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  /**
   * 日数を日本語の期間説明に変換する
   */
  static getDateRangeDescription(days: number): string {
    if (days >= 365) return `約${Math.round(days / 365)}年`;
    if (days >= 28 && days % 30 <= 5) return `約${Math.round(days / 30)}ヶ月`;
    if (days % 7 === 0 && days <= 28) return `${days / 7}週間`;
    return `${days}日間`;
  }

  /**
   * 期間内の曜日別日数分布を返す（[日,月,火,水,木,金,土]）
   */
  static getWeekdayDistribution(from: Date, to: Date): number[] {
    const dist = new Array(7).fill(0);
    const current = DateRangeHelper.toStartOfDay(from);
    const end = DateRangeHelper.toStartOfDay(to);
    while (current <= end) {
      dist[current.getDay()]++;
      current.setDate(current.getDate() + 1);
    }
    return dist;
  }

  /**
   * 2つの日付が同じ週（日曜始まり）に属するか判定する
   */
  static isSameWeek(date1: Date, date2: Date): boolean {
    const d1 = DateRangeHelper.toStartOfDay(date1);
    const d2 = DateRangeHelper.toStartOfDay(date2);
    const startOfWeek1 = new Date(d1);
    startOfWeek1.setDate(d1.getDate() - d1.getDay());
    const startOfWeek2 = new Date(d2);
    startOfWeek2.setDate(d2.getDate() - d2.getDay());
    return startOfWeek1.getTime() === startOfWeek2.getTime();
  }

  /**
   * 指定日の週の開始日（日曜）と終了日（土曜）を返す
   */
  static getWeekRange(date: Date): { start: Date; end: Date } {
    const d = DateRangeHelper.toStartOfDay(date);
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  /**
   * 営業日/休日ラベルを返す
   */
  static getBusinessDayLabel(date: Date): string {
    return DateRangeHelper.isWeekend(date) ? '休日' : '営業日';
  }

  /**
   * 相対日付ラベルを返す（今日、昨日、明日、N日前、N日後、N週間前）
   */
  static getRelativeDateLabel(date: Date, today: Date): string {
    const diff = DateRangeHelper.diffDays(today, date);
    if (diff === 0) return '今日';
    if (diff === 1) return '明日';
    if (diff === -1) return '昨日';
    if (diff < 0 && diff % DateRangeHelper.DAYS_IN_WEEK === 0) return `${Math.abs(diff) / DateRangeHelper.DAYS_IN_WEEK}週間前`;
    if (diff < 0) return `${Math.abs(diff)}日前`;
    if (diff > 0 && diff % DateRangeHelper.DAYS_IN_WEEK === 0) return `${diff / DateRangeHelper.DAYS_IN_WEEK}週間後`;
    return `${diff}日後`;
  }

  /**
   * 日付文字列配列が全て連続しているかチェックする
   */
  static isConsecutiveDates(dateKeys: string[]): boolean {
    if (dateKeys.length <= 1) return true;
    for (let i = 1; i < dateKeys.length; i++) {
      const prev = new Date(dateKeys[i - 1]);
      const curr = new Date(dateKeys[i]);
      const diffMs = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffMs / DateRangeHelper.MS_PER_DAY);
      if (diffDays !== 1) return false;
    }
    return true;
  }

  /**
   * 日数間隔配列から日付の密集度スコア(0-100)を算出する
   * 間隔が短いほど高スコア（最大間隔30日基準）
   */
  static getDateClusterAnalysis(intervals: number[]): number {
    if (intervals.length === 0) return 0;
    if (intervals.length === 1 && intervals[0] <= 1) return 100;
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.max(0, Math.min(100, Math.round(100 - (avg / DateRangeHelper.CLUSTER_MAX_INTERVAL) * 100)));
  }

  /**
   * 密集度スコアに応じたラベルを返す
   */
  static getClusterLabel(score: number): string {
    if (score >= DateRangeHelper.CLUSTER_DENSE_THRESHOLD) return '密集';
    if (score >= DateRangeHelper.CLUSTER_MODERATE_THRESHOLD) return '中程度';
    return '疎ら';
  }

  /**
   * 日付キー配列の最初と最後の日付間の日数を算出する
   */
  static getDateSpanDays(dateKeys: string[]): number {
    if (dateKeys.length <= 1) return 0;
    const sorted = [...dateKeys].sort();
    const first = new Date(sorted[0] + 'T00:00:00');
    const last = new Date(sorted[sorted.length - 1] + 'T00:00:00');
    return Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 日付キー配列の密度スコア(0-100)を算出する
   * ユニーク日数 / (最初〜最後の全日数) * 100
   */
  static getDateDensityScore(dateKeys: string[]): number {
    if (dateKeys.length === 0) return 0;
    const unique = [...new Set(dateKeys)].sort();
    if (unique.length === 1) return 100;
    const first = new Date(unique[0] + 'T00:00:00');
    const last = new Date(unique[unique.length - 1] + 'T00:00:00');
    const totalDays = Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (totalDays <= 0) return 100;
    return Math.min(100, Math.round((unique.length / totalDays) * 100));
  }

  /**
   * 日付密度スコアに応じたラベルを返す
   */
  static getDateDensityLabel(score: number): string {
    if (score >= DateRangeHelper.DENSITY_HIGH_THRESHOLD) return '高密度';
    if (score >= DateRangeHelper.DENSITY_MODERATE_THRESHOLD) return '中密度';
    return '低密度';
  }

  /**
   * 日付範囲日数に応じたラベルを返す
   */
  static getDateSpanLabel(days: number): string {
    if (days === 0) return '当日';
    if (days < DateRangeHelper.SPAN_SHORT_THRESHOLD) return '短期間';
    if (days < DateRangeHelper.SPAN_LONG_THRESHOLD) return '中期間';
    return '長期間';
  }

  /**
   * 曜日インデックス配列(0=日〜6=土)から集中度(0-100)を算出する
   * 最頻曜日の出現率を100点満点で正規化（均等=1/7=14.3%→0, 全集中=100%→100）
   */
  static getWeekdayConcentration(dayIndices: number[]): number {
    if (dayIndices.length === 0) return 0;
    if (dayIndices.length === 1) return 100;
    const counts = new Array(DateRangeHelper.DAYS_IN_WEEK).fill(0);
    for (const d of dayIndices) {
      if (d >= 0 && d < DateRangeHelper.DAYS_IN_WEEK) counts[d]++;
    }
    const maxCount = Math.max(...counts);
    const maxRatio = maxCount / dayIndices.length;
    const minRatio = 1 / DateRangeHelper.DAYS_IN_WEEK;
    if (maxRatio <= minRatio) return 0;
    return Math.round(((maxRatio - minRatio) / (1 - minRatio)) * 100);
  }

  /**
   * 曜日集中度に応じたラベルを返す
   */
  static getWeekdayConcentrationLabel(score: number): string {
    if (score >= DateRangeHelper.WEEKDAY_CONCENTRATION_HIGH_THRESHOLD) return '集中';
    if (score >= DateRangeHelper.WEEKDAY_CONCENTRATION_MODERATE_THRESHOLD) return 'やや偏り';
    return '分散';
  }

  /**
   * 日付間隔配列の規則性スコア(0-100)を算出する
   * 変動係数ベースで間隔の均一性を評価
   */
  static getDateGapScore(gaps: number[]): number {
    if (gaps.length <= 1) return 0;
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avg === 0) return 100;
    const variance = gaps.reduce((sum, v) => sum + (v - avg) ** 2, 0) / gaps.length;
    const cv = Math.sqrt(variance) / avg;
    return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
  }

  /**
   * 日付間隔スコアに応じたラベルを返す
   */
  static getDateGapScoreLabel(score: number): string {
    if (score >= DateRangeHelper.DATE_GAP_REGULAR_THRESHOLD) return '規則的';
    if (score >= DateRangeHelper.DATE_GAP_MODERATE_THRESHOLD) return 'やや不規則';
    return '不規則';
  }

  /**
   * 曜日番号配列(0=日〜6=土)から休日(土日)の割合(0-100)を算出する
   */
  static getWeekendRatio(dayOfWeeks: number[]): number {
    if (dayOfWeeks.length === 0) return 0;
    const weekendCount = dayOfWeeks.filter((d) => d === 0 || d === 6).length;
    return Math.round((weekendCount / dayOfWeeks.length) * 100);
  }

  /**
   * 休日比率に応じたラベルを返す
   */
  static getWeekendRatioLabel(ratio: number): string {
    if (ratio >= DateRangeHelper.WEEKEND_RATIO_HIGH_THRESHOLD) return '休日中心';
    if (ratio >= DateRangeHelper.WEEKEND_RATIO_LOW_THRESHOLD) return '均等';
    return '平日中心';
  }

  /**
   * 日付スパンスコア(0-100)を算出する
   * 実日数/目標日数の割合（上限100）
   */
  static getDateSpanScore(actualDays: number, targetDays: number): number {
    if (targetDays <= 0 || actualDays <= 0) return 0;
    return Math.min(100, Math.round((actualDays / targetDays) * 100));
  }

  /**
   * 日付スパンスコアに応じたラベルを返す
   */
  static getDateSpanScoreLabel(score: number): string {
    if (score >= DateRangeHelper.DATE_SPAN_SUFFICIENT_THRESHOLD) return '十分';
    if (score >= DateRangeHelper.DATE_SPAN_MODERATE_THRESHOLD) return 'やや不足';
    return '不足';
  }

  /**
   * 日付間隔の規則性スコアを算出する（0-100）
   * 変動係数(CV)が小さいほどスコアが高い
   */
  static getDateRegularityScore(intervals: number[]): number {
    if (intervals.length <= 1) return intervals.length === 0 ? 0 : 100;
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avg === 0) return 0;
    const variance =
      intervals.reduce((sum, v) => sum + (v - avg) ** 2, 0) / intervals.length;
    const cv = (Math.sqrt(variance) / avg) * 100;
    return Math.max(
      0,
      Math.min(100, Math.round(100 - (cv / DateRangeHelper.DATE_REGULARITY_MAX_CV) * 100))
    );
  }

  /**
   * 日付規則性スコアに応じたラベルを返す
   */
  static getDateRegularityScoreLabel(score: number): string {
    if (score >= DateRangeHelper.DATE_REGULARITY_HIGH_THRESHOLD) return '規則的';
    if (score >= DateRangeHelper.DATE_REGULARITY_MODERATE_THRESHOLD) return 'やや不規則';
    return '不規則';
  }
}
