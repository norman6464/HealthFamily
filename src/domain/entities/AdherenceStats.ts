/**
 * 服薬アドヒアランス統計エンティティ
 */

import { DateRangeHelper } from './DateRange';
import { MathHelper } from './MathHelper';

export interface MemberAdherenceStats {
  readonly memberId: string;
  readonly memberName: string;
  readonly weeklyRate: number;
  readonly monthlyRate: number;
  readonly weeklyCount: number;
  readonly monthlyCount: number;
}

export interface StreakInfo {
  readonly current: number;
  readonly longest: number;
  readonly message: string;
}

export interface AdherenceStats {
  readonly overall: {
    readonly weeklyRate: number;
    readonly monthlyRate: number;
    readonly weeklyCount: number;
    readonly monthlyCount: number;
  };
  readonly members: MemberAdherenceStats[];
  readonly streak?: StreakInfo;
}

/**
 * アドヒアランス率のビジネスロジック
 */
export class AdherenceStatsEntity {
  constructor(private readonly stats: AdherenceStats) {}

  /**
   * アドヒアランス率のレベルを返す
   */
  static getRateLevel(rate: number): 'excellent' | 'good' | 'warning' | 'poor' {
    if (rate >= 90) return 'excellent';
    if (rate >= 70) return 'good';
    if (rate >= 50) return 'warning';
    return 'poor';
  }

  /**
   * アドヒアランス率のラベルを返す
   */
  static getRateLabel(rate: number): string {
    const level = AdherenceStatsEntity.getRateLevel(rate);
    const labels: Record<string, string> = {
      excellent: '優秀',
      good: '良好',
      warning: '注意',
      poor: '要改善',
    };
    return labels[level];
  }

  get data(): AdherenceStats {
    return this.stats;
  }

  /**
   * 曜日配列の有効日数を取得（空配列は毎日=7日）
   */
  static getActiveDaysCount(daysOfWeek: string[]): number {
    return daysOfWeek.length === 0 ? 7 : daysOfWeek.length;
  }

  /**
   * 週間期待数を算出
   */
  static calculateWeeklyExpected(schedules: { daysOfWeek: string[] }[]): number {
    return schedules.reduce(
      (sum, s) => sum + Math.min(AdherenceStatsEntity.getActiveDaysCount(s.daysOfWeek), 7),
      0,
    );
  }

  /**
   * 月間期待数を算出（30日ベース）
   */
  static calculateMonthlyExpected(schedules: { daysOfWeek: string[] }[]): number {
    return schedules.reduce((sum, s) => {
      const daysPerWeek = AdherenceStatsEntity.getActiveDaysCount(s.daysOfWeek);
      return sum + Math.round(daysPerWeek * (30 / 7));
    }, 0);
  }

  /**
   * 遵守率を算出（0-100%）
   */
  static calculateRate(actual: number, expected: number): number {
    return MathHelper.calculatePercentage(actual, expected, true);
  }

  /**
   * 現在のストリーク（連続服薬日数）を算出
   * todayから遡って連続して記録がある日数を返す
   */
  static calculateStreak(recordDates: Date[], today: Date): number {
    if (recordDates.length === 0) return 0;

    const uniqueDays = new Set(recordDates.map((d) => DateRangeHelper.toDateKey(d)));
    const todayKey = DateRangeHelper.toDateKey(today);

    if (!uniqueDays.has(todayKey)) return 0;

    let streak = 0;
    const current = new Date(today);
    current.setHours(0, 0, 0, 0);

    while (uniqueDays.has(DateRangeHelper.toDateKey(current))) {
      streak++;
      current.setDate(current.getDate() - 1);
    }

    return streak;
  }

  /**
   * 最長ストリーク（連続服薬日数の最大値）を算出
   */
  static calculateLongestStreak(recordDates: Date[]): number {
    if (recordDates.length === 0) return 0;

    const uniqueDays = [...new Set(recordDates.map((d) => DateRangeHelper.toDateKey(d)))].sort().reverse();

    let longest = 1;
    let current = 1;

    for (let i = 1; i < uniqueDays.length; i++) {
      const prevDate = new Date(uniqueDays[i - 1] + 'T00:00:00');
      const currDate = new Date(uniqueDays[i] + 'T00:00:00');
      const diffDays = DateRangeHelper.diffDays(currDate, prevDate);

      if (diffDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  }

  /**
   * ストリークに応じた応援メッセージを返す
   */
  static getStreakMessage(streak: number): string {
    if (streak === 0) return '今日から始めよう';
    if (streak < 7) return '良いスタート';
    if (streak < 30) return '素晴らしい習慣';
    return '完璧な継続';
  }

  /**
   * 今週と前週の遵守率を比較したメッセージを返す
   */
  static getComparisonMessage(currentRate: number, previousRate: number): string {
    const diff = currentRate - previousRate;
    if (diff >= 10) return '先週より改善しています';
    if (diff <= -10) return '先週より下がっています';
    return '先週と同じペースです';
  }

  /**
   * 遵守率に応じたレベルを判定
   */
  static getAdherenceLevel(rate: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (rate >= 90) return 'excellent';
    if (rate >= 70) return 'good';
    if (rate >= 50) return 'fair';
    return 'poor';
  }

  /**
   * 遵守率レベルに応じたスタイルクラスを返す
   */
  static getAdherenceLevelStyle(level: 'excellent' | 'good' | 'fair' | 'poor'): { bg: string; text: string } {
    const styles: Record<string, { bg: string; text: string }> = {
      excellent: { bg: 'bg-green-50', text: 'text-green-600' },
      good: { bg: 'bg-blue-50', text: 'text-blue-600' },
      fair: { bg: 'bg-orange-50', text: 'text-orange-600' },
      poor: { bg: 'bg-red-50', text: 'text-red-600' },
    };
    return styles[level];
  }

  /**
   * ストリーク日数に応じたランクを判定
   */
  static getStreakRank(streak: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (streak >= 90) return 'platinum';
    if (streak >= 30) return 'gold';
    if (streak >= 7) return 'silver';
    return 'bronze';
  }

  /**
   * ストリークランクに応じたスタイルクラスを返す
   */
  static getStreakRankStyle(rank: 'bronze' | 'silver' | 'gold' | 'platinum'): { bg: string; text: string } {
    const styles: Record<string, { bg: string; text: string }> = {
      bronze: { bg: 'bg-orange-50', text: 'text-orange-600' },
      silver: { bg: 'bg-gray-50', text: 'text-gray-600' },
      gold: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
      platinum: { bg: 'bg-purple-50', text: 'text-purple-600' },
    };
    return styles[rank];
  }

  /**
   * マイルストーン日数かどうかを判定
   */
  static isStreakMilestone(streak: number): boolean {
    return AdherenceStatsEntity.MILESTONES.includes(streak);
  }

  /**
   * 曜日別の服薬率を算出する
   * 返り値: [日, 月, 火, 水, 木, 金, 土] の服薬率(0-100)
   */
  static getDayOfWeekRates(recordDates: Date[], expected: number[]): number[] {
    const counts = new Array(7).fill(0);
    for (const date of recordDates) {
      counts[date.getDay()]++;
    }
    return expected.map((exp, i) => {
      if (exp === 0) return 0;
      return MathHelper.calculatePercentage(counts[i], exp, true);
    });
  }

  /**
   * 最も服薬率が高い曜日インデックスを返す
   */
  static getBestDay(rates: number[]): number | null {
    const max = Math.max(...rates);
    if (max === 0) return null;
    return rates.indexOf(max);
  }

  /**
   * 最も服薬率が低い曜日インデックスを返す（0%の曜日は除外）
   */
  static getWorstDay(rates: number[]): number | null {
    const nonZeroRates = rates.map((r, i) => ({ rate: r, index: i })).filter((r) => r.rate > 0);
    if (nonZeroRates.length === 0) return null;
    return nonZeroRates.reduce((min, r) => (r.rate < min.rate ? r : min)).index;
  }

  /**
   * 遵守率に応じたグレードを返す
   */
  static getComplianceGrade(rate: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (rate >= 90) return 'A';
    if (rate >= 80) return 'B';
    if (rate >= 60) return 'C';
    if (rate >= 40) return 'D';
    return 'F';
  }

  /**
   * グレードに応じたメッセージを返す
   */
  static getComplianceMessage(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
    const messages: Record<string, string> = {
      A: 'とても良い服薬管理です',
      B: '良好な服薬管理です',
      C: 'もう少し改善できます',
      D: '服薬の見直しが必要です',
      F: '服薬管理を始めましょう',
    };
    return messages[grade];
  }

  /**
   * グレードに応じた色クラスを返す
   */
  static getComplianceColor(grade: 'A' | 'B' | 'C' | 'D' | 'F'): string {
    const colors: Record<string, string> = {
      A: 'text-green-600',
      B: 'text-blue-600',
      C: 'text-yellow-600',
      D: 'text-orange-600',
      F: 'text-red-600',
    };
    return colors[grade];
  }

  /**
   * 今週と先週の遵守率を比較し詳細情報を返す
   */
  static getWeeklyComparisonDetail(
    currentRate: number,
    previousRate: number,
  ): { direction: 'up' | 'down' | 'stable'; diff: number; message: string } {
    const diff = Math.abs(currentRate - previousRate);
    if (diff <= 5) {
      return { direction: 'stable', diff, message: '先週と同水準を維持しています' };
    }
    if (currentRate > previousRate) {
      return { direction: 'up', diff, message: `先週より${diff}%改善しました` };
    }
    return { direction: 'down', diff, message: `先週より${diff}%低下しています` };
  }

  /**
   * 遵守率の変化量をラベルで返す
   */
  static getRateChangeLabel(change: number): string {
    if (change === 0) return '変化なし';
    if (change > 0) return `+${change}%`;
    return `${change}%`;
  }

  /**
   * 遵守率に基づいた動機付けメッセージを返す
   */
  static getMotivationMessage(rate: number): string {
    if (rate >= 90) return 'この調子で続けましょう';
    if (rate >= 70) return '良いペースです。あと少しで最高評価です';
    if (rate >= 50) return '少しずつ習慣にしていきましょう';
    return '一回でも記録をつけることが大切です';
  }

  private static readonly MILESTONES = [7, 14, 30, 60, 90, 100, 180, 365];
  private static readonly EFFICIENCY_MAX_STREAK = 30;
  private static readonly EFFICIENCY_RATE_WEIGHT = 0.7;
  private static readonly EFFICIENCY_STREAK_WEIGHT = 0.3;
  private static readonly EFFICIENCY_HIGH_THRESHOLD = 80;
  private static readonly EFFICIENCY_MODERATE_THRESHOLD = 50;
  private static readonly CONSISTENCY_HIGH_THRESHOLD = 80;
  private static readonly CONSISTENCY_MODERATE_THRESHOLD = 50;
  private static readonly CONSISTENCY_MAX_STDDEV = 50;

  /**
   * 現在の連続日数から次のマイルストーンを取得する
   */
  static getNextMilestone(currentStreak: number): number | null {
    return AdherenceStatsEntity.MILESTONES.find((m) => m > currentStreak) ?? null;
  }

  /**
   * 次のマイルストーンまでの残り日数を返す
   */
  static getDaysUntilMilestone(currentStreak: number): number | null {
    const next = AdherenceStatsEntity.getNextMilestone(currentStreak);
    if (next === null) return null;
    return next - currentStreak;
  }

  private static readonly milestoneMessages: Record<number, string> = {
    7: '1週間連続達成です',
    14: '2週間連続達成です',
    30: '1ヶ月連続達成です',
    60: '2ヶ月連続達成です',
    90: '3ヶ月連続達成です',
    100: '100日連続達成です',
    180: '半年連続達成です',
    365: '1年連続達成です',
  };

  /**
   * マイルストーン達成時のメッセージを返す（マイルストーンでない場合はnull）
   */
  static getMilestoneAchievementMessage(streak: number): string | null {
    return AdherenceStatsEntity.milestoneMessages[streak] ?? null;
  }

  /**
   * 今週と先週の服薬率を比較する
   */
  static getWeeklyComparison(
    currentRate: number,
    previousRate: number,
  ): { diff: number; direction: 'up' | 'down' | 'stable' } {
    const diff = currentRate - previousRate;
    if (Math.abs(diff) <= 5) return { diff, direction: 'stable' };
    return { diff, direction: diff > 0 ? 'up' : 'down' };
  }

  /**
   * 週間トレンドのラベルを返す
   */
  static getWeeklyTrendLabel(direction: 'up' | 'down' | 'stable'): string {
    const labels: Record<string, string> = {
      up: '改善',
      down: '低下',
      stable: '維持',
    };
    return labels[direction];
  }

  /**
   * 服薬率に応じた改善提案メッセージを返す
   */
  static getImprovementSuggestion(rate: number): string {
    if (rate >= 90) return 'この調子を維持しましょう';
    if (rate >= 70) return 'あと少しで目標達成です';
    if (rate >= 50) return '服薬を習慣化していきましょう';
    return 'リマインダーを活用してみましょう';
  }

  /**
   * 服薬効率スコアを算出する（0-100）
   * 達成率とストリークから加重平均
   */
  static getAdherenceEfficiencyScore(
    rate: number,
    streakDays: number
  ): number {
    const clampedRate = Math.max(0, Math.min(100, rate));
    const streakNorm =
      Math.min(streakDays, AdherenceStatsEntity.EFFICIENCY_MAX_STREAK) /
      AdherenceStatsEntity.EFFICIENCY_MAX_STREAK;
    return Math.min(
      100,
      Math.round(
        clampedRate * AdherenceStatsEntity.EFFICIENCY_RATE_WEIGHT +
          streakNorm * 100 * AdherenceStatsEntity.EFFICIENCY_STREAK_WEIGHT
      )
    );
  }

  /**
   * 服薬効率スコアに応じたラベルを返す
   */
  static getAdherenceEfficiencyScoreLabel(score: number): string {
    if (score >= AdherenceStatsEntity.EFFICIENCY_HIGH_THRESHOLD) return '高効率';
    if (score >= AdherenceStatsEntity.EFFICIENCY_MODERATE_THRESHOLD) return '普通';
    return '低効率';
  }

  /**
   * 服薬率の一貫性指数を算出する（0-100）
   * 標準偏差が小さいほどスコアが高い
   */
  static getAdherenceConsistencyIndex(rates: number[]): number {
    if (rates.length <= 1) return rates.length === 0 ? 0 : 100;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance =
      rates.reduce((sum, v) => sum + (v - avg) ** 2, 0) / rates.length;
    const stddev = Math.sqrt(variance);
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            (stddev / AdherenceStatsEntity.CONSISTENCY_MAX_STDDEV) * 100
        )
      )
    );
  }

  /**
   * 一貫性指数に応じたラベルを返す
   */
  static getAdherenceConsistencyIndexLabel(score: number): string {
    if (score >= AdherenceStatsEntity.CONSISTENCY_HIGH_THRESHOLD) return '安定';
    if (score >= AdherenceStatsEntity.CONSISTENCY_MODERATE_THRESHOLD) return 'やや不安定';
    return '不安定';
  }
}
