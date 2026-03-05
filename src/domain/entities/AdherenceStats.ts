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
      const diffMs = prevDate.getTime() - currDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

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
    const milestones = [7, 14, 30, 60, 90, 100, 180, 365];
    return milestones.includes(streak);
  }
}
