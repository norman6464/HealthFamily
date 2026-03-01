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
}
