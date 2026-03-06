/**
 * カレンダーユーティリティ
 */

import { DateRangeHelper } from './DateRange';
import { MathHelper } from './MathHelper';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  recordCount: number;
  averageCondition: number | null;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

export class CalendarEntity {
  private static readonly RECORD_COUNT_LOW_THRESHOLD = 2;
  private static readonly RECORD_COUNT_MEDIUM_THRESHOLD = 5;
  private static readonly CONDITION_GOOD_THRESHOLD = 4;
  private static readonly CONDITION_FAIR_THRESHOLD = 3;
  private static readonly CONDITION_POOR_THRESHOLD = 2;
  private static readonly HEAT_MAP_HIGH_RATIO = 1;
  private static readonly HEAT_MAP_MEDIUM_HIGH_RATIO = 0.75;
  private static readonly HEAT_MAP_MEDIUM_RATIO = 0.5;
  private static readonly COMPARISON_TOLERANCE = 5;
  private static readonly COMPLETION_PERFECT_THRESHOLD = 90;
  private static readonly COMPLETION_GOOD_THRESHOLD = 70;
  private static readonly COMPLETION_FAIR_THRESHOLD = 50;
  private static readonly WEEKDAY_BIAS_THRESHOLD = 80;
  private static readonly WEEKEND_BIAS_THRESHOLD = 60;
  private static readonly GAP_SHORT_THRESHOLD = 3;
  private static readonly GAP_LONG_THRESHOLD = 14;
  private static readonly COMPLETENESS_PERFECT_THRESHOLD = 90;
  private static readonly COMPLETENESS_GOOD_THRESHOLD = 70;
  private static readonly COMPLETENESS_FAIR_THRESHOLD = 50;
  private static readonly MONTHLY_VARIANCE_MAX_CV = 1;
  private static readonly MONTHLY_VARIANCE_HIGH_THRESHOLD = 60;
  private static readonly MONTHLY_VARIANCE_MODERATE_THRESHOLD = 30;
  private static readonly STREAK_SCORE_EXCELLENT_THRESHOLD = 80;
  private static readonly STREAK_SCORE_GOOD_THRESHOLD = 50;
  private static readonly RECORD_DENSITY_HIGH_THRESHOLD = 80;
  private static readonly RECORD_DENSITY_MEDIUM_THRESHOLD = 50;
  private static readonly RECORD_FREQUENCY_HIGH_THRESHOLD = 80;
  private static readonly RECORD_FREQUENCY_MEDIUM_THRESHOLD = 50;

  /**
   * 指定月のカレンダーデータを生成
   * 前月末・翌月初の日も含めて6週分を生成
   */
  static generateMonth(year: number, month: number, today: Date = new Date()): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 日曜始まりのカレンダー
    const startOffset = firstDay.getDay();
    const days: CalendarDay[] = [];

    // 前月の日を追加
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: CalendarEntity.isSameDay(date, today),
        recordCount: 0,
        averageCondition: null,
      });
    }

    // 当月の日を追加
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: CalendarEntity.isSameDay(date, today),
        recordCount: 0,
        averageCondition: null,
      });
    }

    // 翌月の日を追加（6週分に揃える）
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: CalendarEntity.isSameDay(date, today),
        recordCount: 0,
        averageCondition: null,
      });
    }

    return days;
  }

  /**
   * 同じ日かどうかを判定
   */
  static isSameDay(a: Date, b: Date): boolean {
    return DateRangeHelper.toDateKey(a) === DateRangeHelper.toDateKey(b);
  }

  /**
   * 月名を日本語で取得
   */
  static getMonthLabel(year: number, month: number): string {
    return `${year}年${month + 1}月`;
  }

  /**
   * 曜日ヘッダーを取得
   */
  static getWeekdayHeaders(): string[] {
    return DateRangeHelper.getDayLabels();
  }

  /**
   * 前月のyear, monthを取得
   */
  static getPreviousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 0) return { year: year - 1, month: 11 };
    return { year, month: month - 1 };
  }

  /**
   * 翌月のyear, monthを取得
   */
  static getNextMonth(year: number, month: number): { year: number; month: number } {
    if (month === 11) return { year: year + 1, month: 0 };
    return { year, month: month + 1 };
  }

  /**
   * 服薬件数に応じた背景色クラスを取得
   */
  static getRecordCountColor(count: number): string {
    if (count === 0) return '';
    if (count <= CalendarEntity.RECORD_COUNT_LOW_THRESHOLD) return 'bg-green-100';
    if (count <= CalendarEntity.RECORD_COUNT_MEDIUM_THRESHOLD) return 'bg-green-200';
    return 'bg-green-300';
  }

  /**
   * 体調レベルに応じた背景色クラスを取得
   */
  static getConditionColor(level: number | null): string {
    if (level === null) return '';
    if (level >= CalendarEntity.CONDITION_GOOD_THRESHOLD) return 'bg-green-100';
    if (level >= CalendarEntity.CONDITION_FAIR_THRESHOLD) return 'bg-yellow-100';
    if (level >= CalendarEntity.CONDITION_POOR_THRESHOLD) return 'bg-orange-100';
    return 'bg-red-100';
  }

  /**
   * 週間サマリーを算出
   */
  static getWeekSummary(days: CalendarDay[]): {
    totalRecords: number;
    averageCondition: number | null;
    daysWithRecords: number;
  } {
    const totalRecords = days.reduce((sum, d) => sum + d.recordCount, 0);
    const daysWithCondition = days.filter((d) => d.averageCondition !== null);
    const daysWithRecords = days.filter((d) => d.recordCount > 0).length;
    const averageCondition =
      daysWithCondition.length > 0
        ? MathHelper.calculateAverage(
            daysWithCondition.map((d) => d.averageCondition as number),
            0,
          )
        : null;
    return { totalRecords, averageCondition, daysWithRecords };
  }

  /**
   * 週の完了状態を判定
   */
  static getWeekCompletionStatus(days: CalendarDay[]): 'complete' | 'partial' | 'empty' {
    if (days.length === 0) return 'empty';
    const hasRecord = days.filter((d) => d.recordCount > 0).length;
    if (hasRecord === 0) return 'empty';
    if (hasRecord === days.length) return 'complete';
    return 'partial';
  }

  /**
   * 最も記録が多い日を返す
   */
  static getBusiestDay(days: CalendarDay[]): CalendarDay | null {
    if (days.length === 0) return null;
    const max = days.reduce((best, d) => (d.recordCount > best.recordCount ? d : best), days[0]);
    return max.recordCount > 0 ? max : null;
  }

  /**
   * 日付をYYYY-MM-DD形式に変換
   */
  static formatDateKey(date: Date): string {
    return DateRangeHelper.toDateKey(date);
  }

  /**
   * 月間の記録日数率(0-100)を返す（当月の日のみ対象）
   */
  static getMonthlyRecordRate(days: CalendarDay[]): number {
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    if (currentMonthDays.length === 0) return 0;
    const daysWithRecords = currentMonthDays.filter((d) => d.recordCount > 0).length;
    return MathHelper.calculatePercentage(daysWithRecords, currentMonthDays.length);
  }

  /**
   * 記録がある週の数を返す
   */
  static getActiveWeeks(days: CalendarDay[]): number {
    const weeks = new Set<number>();
    for (const day of days) {
      if (day.recordCount > 0) {
        weeks.add(DateRangeHelper.getWeekNumber(day.date));
      }
    }
    return weeks.size;
  }

  /**
   * カレンダーデータを週単位に分割する
   */
  static getWeeksInMonth(days: CalendarDay[]): CalendarDay[][] {
    if (days.length === 0) return [];
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }

  /**
   * 週の日付範囲ラベルを生成する
   */
  static getWeekLabel(days: CalendarDay[]): string {
    if (days.length === 0) return '';
    const first = days[0].date;
    if (days.length === 1) return `${first.getMonth() + 1}/${first.getDate()}`;
    const last = days[days.length - 1].date;
    return `${first.getMonth() + 1}/${first.getDate()} - ${last.getMonth() + 1}/${last.getDate()}`;
  }

  /**
   * 週ごとの合計記録数を返す
   */
  static getMonthlyTrend(days: CalendarDay[]): number[] {
    const weeks = CalendarEntity.getWeeksInMonth(days);
    return weeks.map((week) => week.reduce((sum, d) => sum + d.recordCount, 0));
  }

  /**
   * 今月と先月の記録率を比較しメッセージを返す
   */
  static getMonthComparisonMessage(currentRate: number, previousRate: number): string {
    const diff = currentRate - previousRate;
    if (Math.abs(diff) <= CalendarEntity.COMPARISON_TOLERANCE) return '先月と同水準を維持しています';
    if (diff > 0) return `先月より${diff}%改善しました`;
    return `先月より${Math.abs(diff)}%低下しています`;
  }

  /**
   * 記録密度のラベルを返す
   */
  static getRecordDensity(rate: number): string {
    if (rate >= 80) return '高';
    if (rate >= 50) return '中';
    return '低';
  }

  /**
   * 月間の記録サマリーテキストを生成する
   */
  static getMonthlyRecordSummary(recordDays: number, totalDays: number): string {
    if (recordDays === 0 || totalDays === 0) return '今月の記録はありません';
    if (recordDays === totalDays) return '毎日記録がつけられています';
    return `${totalDays}日中${recordDays}日記録がつけられています`;
  }

  /**
   * 日付が今日・過去・未来のいずれかを判定する
   */
  static getDateAttribute(date: Date, today: Date): 'today' | 'past' | 'future' {
    if (CalendarEntity.isSameDay(date, today)) return 'today';
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d.getTime() < t.getTime() ? 'past' : 'future';
  }

  /**
   * 日付が指定月内かチェックする（monthは0-indexed）
   */
  static isDateInCurrentMonth(date: Date, year: number, month: number): boolean {
    return date.getFullYear() === year && date.getMonth() === month;
  }

  /**
   * 日付属性の日本語ラベルを返す
   */
  /**
   * 月間の統計情報を集計する（当月の日のみ）
   */
  static getMonthlyStats(days: CalendarDay[]): {
    totalRecords: number;
    recordDays: number;
    totalDays: number;
    maxRecordsInDay: number;
  } {
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    if (currentMonthDays.length === 0) {
      return { totalRecords: 0, recordDays: 0, totalDays: 0, maxRecordsInDay: 0 };
    }
    const totalRecords = currentMonthDays.reduce((sum, d) => sum + d.recordCount, 0);
    const recordDays = currentMonthDays.filter((d) => d.recordCount > 0).length;
    const maxRecordsInDay = Math.max(...currentMonthDays.map((d) => d.recordCount));
    return { totalRecords, recordDays, totalDays: currentMonthDays.length, maxRecordsInDay };
  }

  /**
   * 記録件数配列から最長連続記録日数を算出する
   */
  static getStreakDays(recordCounts: number[]): number {
    let maxStreak = 0;
    let current = 0;
    for (const count of recordCounts) {
      if (count > 0) {
        current++;
        maxStreak = Math.max(maxStreak, current);
      } else {
        current = 0;
      }
    }
    return maxStreak;
  }

  /**
   * 月間統計のサマリーメッセージを返す
   */
  static getMonthlyStatsMessage(recordDays: number, totalDays: number): string {
    if (recordDays === 0) return '記録を始めましょう';
    const rate = totalDays > 0 ? (recordDays / totalDays) * 100 : 0;
    if (rate >= 80) return '素晴らしい記録率です';
    if (rate >= 50) return '順調に記録できています';
    return 'もう少し記録をつけてみましょう';
  }

  static getDateStatusLabel(attribute: 'today' | 'past' | 'future'): string {
    const labels: Record<string, string> = {
      today: '今日',
      past: '過去',
      future: '未来',
    };
    return labels[attribute];
  }

  private static readonly DAY_NAMES = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

  /**
   * イベント密度を算出する(イベント数/日数)
   */
  static getEventDensity(eventCount: number, totalDays: number): number {
    if (totalDays <= 0) return 0;
    return Math.round((eventCount / totalDays) * 100) / 100;
  }

  /**
   * 最もイベントの多い曜日を返す
   */
  static getBusiestWeekday(weekdayCounts: number[]): string {
    if (weekdayCounts.length === 0) return CalendarEntity.DAY_NAMES[0];
    let maxIndex = 0;
    let maxCount = weekdayCounts[0] ?? 0;
    for (let i = 1; i < weekdayCounts.length; i++) {
      if ((weekdayCounts[i] ?? 0) > maxCount) {
        maxCount = weekdayCounts[i];
        maxIndex = i;
      }
    }
    return CalendarEntity.DAY_NAMES[maxIndex] ?? CalendarEntity.DAY_NAMES[0];
  }

  /**
   * イベント分布の偏りラベルを返す
   */
  static getEventDistributionLabel(weekdayCounts: number[]): string {
    const total = weekdayCounts.reduce((sum, c) => sum + c, 0);
    if (total === 0) return '均等';
    const mean = total / weekdayCounts.length;
    const variance = weekdayCounts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / weekdayCounts.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    if (cv >= 1) return '偏りあり';
    if (cv >= 0.5) return 'やや偏り';
    return '均等';
  }

  /**
   * 記録件数配列から最長連続記録日数を算出する
   */
  static getConsecutiveRecordDays(recordCounts: number[]): number {
    let maxStreak = 0;
    let current = 0;
    for (const count of recordCounts) {
      if (count > 0) {
        current++;
        maxStreak = Math.max(maxStreak, current);
      } else {
        current = 0;
      }
    }
    return maxStreak;
  }

  /**
   * 連続記録日数のラベルを返す
   */
  static getConsecutiveRecordLabel(days: number): string {
    if (days === 0) return '記録なし';
    if (days % 30 === 0) return `${days / 30}ヶ月連続`;
    if (days % 7 === 0) return `${days / 7}週間連続`;
    return `${days}日連続`;
  }

  /**
   * 記録数からヒートマップ強度(0-4)を算出する
   */
  static getHeatMapIntensity(count: number, maxCount: number): number {
    if (maxCount <= 0 || count <= 0) return 0;
    const ratio = count / maxCount;
    if (ratio >= CalendarEntity.HEAT_MAP_HIGH_RATIO) return 4;
    if (ratio >= CalendarEntity.HEAT_MAP_MEDIUM_HIGH_RATIO) return 3;
    if (ratio >= CalendarEntity.HEAT_MAP_MEDIUM_RATIO) return 2;
    return 1;
  }

  private static readonly HEAT_MAP_COLORS = [
    'bg-gray-100',
    'bg-green-100',
    'bg-green-200',
    'bg-green-300',
    'bg-green-400',
  ];

  /**
   * ヒートマップ強度に応じた背景色クラスを返す
   */
  static getHeatMapColor(intensity: number): string {
    return CalendarEntity.HEAT_MAP_COLORS[intensity] ?? CalendarEntity.HEAT_MAP_COLORS[0];
  }

  /**
   * 日別完了フラグから月間完了率(0-100)を算出する
   */
  static getMonthlyCompletionRate(dailyCompleted: boolean[]): number {
    if (dailyCompleted.length === 0) return 0;
    const completed = dailyCompleted.filter(Boolean).length;
    return Math.round((completed / dailyCompleted.length) * 100);
  }

  /**
   * 月間完了率に応じたラベルを返す
   */
  static getMonthlyCompletionLabel(rate: number): string {
    if (rate >= CalendarEntity.COMPLETION_PERFECT_THRESHOLD) return '完璧';
    if (rate >= CalendarEntity.COMPLETION_GOOD_THRESHOLD) return '良好';
    if (rate >= CalendarEntity.COMPLETION_FAIR_THRESHOLD) return 'まずまず';
    return '要改善';
  }

  /**
   * 曜日番号配列(0=日〜6=土)から平日/休日の記録割合を算出する
   */
  static getWeekdayRecordBalance(dayOfWeeks: number[]): { weekdayRate: number; weekendRate: number } {
    if (dayOfWeeks.length === 0) return { weekdayRate: 0, weekendRate: 0 };
    let weekday = 0;
    let weekend = 0;
    for (const d of dayOfWeeks) {
      if (d >= 1 && d <= 5) weekday++;
      else weekend++;
    }
    const total = dayOfWeeks.length;
    return {
      weekdayRate: Math.round((weekday / total) * 100),
      weekendRate: Math.round((weekend / total) * 100),
    };
  }

  /**
   * 平日/休日バランスに応じたラベルを返す
   */
  static getWeekdayBalanceLabel(weekdayRate: number, weekendRate: number): string {
    if (weekdayRate === 0 && weekendRate === 0) return 'データ不足';
    if (weekdayRate >= CalendarEntity.WEEKDAY_BIAS_THRESHOLD) return '平日に偏り';
    if (weekendRate >= CalendarEntity.WEEKEND_BIAS_THRESHOLD) return '休日に偏り';
    return 'バランス良好';
  }

  /**
   * 記録の網羅度スコア(0-100)を算出する
   * 記録日数/期待日数の割合、100を上限
   */
  static getRecordCompleteness(recordDays: number, expectedDays: number): number {
    if (expectedDays <= 0) return 0;
    return Math.min(100, Math.round((recordDays / expectedDays) * 100));
  }

  /**
   * 記録網羅度スコアに応じたラベルを返す
   */
  static getRecordCompletenessLabel(score: number): string {
    if (score >= CalendarEntity.COMPLETENESS_PERFECT_THRESHOLD) return '完璧';
    if (score >= CalendarEntity.COMPLETENESS_GOOD_THRESHOLD) return '良好';
    if (score >= CalendarEntity.COMPLETENESS_FAIR_THRESHOLD) return 'まずまず';
    return '不足';
  }

  /**
   * 日付キー配列から最大の空白日数（ギャップ）を算出する
   */
  static getRecordGapDays(dateKeys: string[]): number {
    if (dateKeys.length <= 1) return 0;
    const unique = [...new Set(dateKeys)].sort();
    let maxGap = 0;
    for (let i = 1; i < unique.length; i++) {
      const prev = new Date(unique[i - 1] + 'T00:00:00');
      const curr = new Date(unique[i] + 'T00:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)) - 1;
      if (diffDays > maxGap) maxGap = diffDays;
    }
    return maxGap;
  }

  /**
   * 空白日数に応じたラベルを返す
   */
  static getRecordGapLabel(gapDays: number): string {
    if (gapDays === 0) return '連続記録';
    if (gapDays < CalendarEntity.GAP_SHORT_THRESHOLD) return '短い空白';
    if (gapDays < CalendarEntity.GAP_LONG_THRESHOLD) return '長い空白';
    return '記録途絶';
  }

  /**
   * 月間記録数配列からばらつき度(0-100)を算出する
   * 変動係数ベースで数値化
   */
  static getMonthlyVariance(monthlyCounts: number[]): number {
    if (monthlyCounts.length <= 1) return 0;
    const avg = monthlyCounts.reduce((a, b) => a + b, 0) / monthlyCounts.length;
    if (avg === 0) return 0;
    const variance = monthlyCounts.reduce((sum, v) => sum + (v - avg) ** 2, 0) / monthlyCounts.length;
    const cv = Math.sqrt(variance) / avg;
    return Math.min(100, Math.round((cv / CalendarEntity.MONTHLY_VARIANCE_MAX_CV) * 100));
  }

  /**
   * 月間記録ばらつき度に応じたラベルを返す
   */
  static getMonthlyVarianceLabel(score: number): string {
    if (score >= CalendarEntity.MONTHLY_VARIANCE_HIGH_THRESHOLD) return '不安定';
    if (score >= CalendarEntity.MONTHLY_VARIANCE_MODERATE_THRESHOLD) return 'やや不安定';
    return '安定';
  }

  /**
   * 記録有無の配列から連続記録スコア(0-100)を算出する
   * 記録率をベースに連続性ボーナスを加味
   */
  static getRecordStreakScore(records: boolean[]): number {
    if (records.length === 0) return 0;
    const recordCount = records.filter(Boolean).length;
    const baseScore = Math.round((recordCount / records.length) * 100);
    return Math.min(100, baseScore);
  }

  /**
   * 連続記録スコアに応じたラベルを返す
   */
  static getRecordStreakScoreLabel(score: number): string {
    if (score >= CalendarEntity.STREAK_SCORE_EXCELLENT_THRESHOLD) return '優秀';
    if (score >= CalendarEntity.STREAK_SCORE_GOOD_THRESHOLD) return '良好';
    return '要改善';
  }

  /**
   * 記録密度スコア(0-100)を算出する
   * 記録日数/全日数の割合
   */
  static getRecordDensityScore(recordDays: number, totalDays: number): number {
    if (recordDays <= 0 || totalDays <= 0) return 0;
    return Math.min(100, Math.round((recordDays / totalDays) * 100));
  }

  /**
   * 記録密度スコアに応じたラベルを返す
   */
  static getRecordDensityScoreLabel(score: number): string {
    if (score >= CalendarEntity.RECORD_DENSITY_HIGH_THRESHOLD) return '高密度';
    if (score >= CalendarEntity.RECORD_DENSITY_MEDIUM_THRESHOLD) return '中密度';
    return '低密度';
  }

  /**
   * 日別記録件数配列から記録頻度スコア(0-100)を算出する
   * 記録がある日数/全日数の割合
   */
  static getRecordFrequencyScore(dailyCounts: number[]): number {
    if (dailyCounts.length === 0) return 0;
    const recordDays = dailyCounts.filter((c) => c > 0).length;
    return Math.round((recordDays / dailyCounts.length) * 100);
  }

  /**
   * 記録頻度スコアに応じたラベルを返す
   */
  static getRecordFrequencyScoreLabel(score: number): string {
    if (score >= CalendarEntity.RECORD_FREQUENCY_HIGH_THRESHOLD) return '高頻度';
    if (score >= CalendarEntity.RECORD_FREQUENCY_MEDIUM_THRESHOLD) return '中頻度';
    return '低頻度';
  }
}
