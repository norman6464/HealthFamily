/**
 * 服薬アドヒアランス統計エンティティ
 */

export interface MemberAdherenceStats {
  readonly memberId: string;
  readonly memberName: string;
  readonly weeklyRate: number;
  readonly monthlyRate: number;
  readonly weeklyCount: number;
  readonly monthlyCount: number;
}

export interface AdherenceStats {
  readonly overall: {
    readonly weeklyRate: number;
    readonly monthlyRate: number;
    readonly weeklyCount: number;
    readonly monthlyCount: number;
  };
  readonly members: MemberAdherenceStats[];
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
    if (expected <= 0) return 0;
    return Math.min(100, Math.round((actual / expected) * 100));
  }
}
