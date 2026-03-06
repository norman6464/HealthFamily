/**
 * 服薬トレンドエンティティ
 */

export interface DayOfWeekStat {
  readonly day: number; // 0=日, 1=月, ..., 6=土
  readonly dayLabel: string;
  readonly count: number;
  readonly expected: number;
  readonly rate: number;
}

export interface AdherenceTrend {
  readonly dayOfWeekStats: DayOfWeekStat[];
  readonly bestDay: string;
  readonly worstDay: string;
  readonly previousPeriodRate: number;
  readonly currentPeriodRate: number;
  readonly rateChange: number;
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export class AdherenceTrendEntity {
  constructor(private readonly trend: AdherenceTrend) {}

  get data(): AdherenceTrend {
    return this.trend;
  }

  isImproving(): boolean {
    return this.trend.rateChange > 0;
  }

  isDeclining(): boolean {
    return this.trend.rateChange < 0;
  }

  getRateChangeLabel(): string {
    return AdherenceTrendEntity.formatRateChange(this.trend.rateChange);
  }

  /**
   * 変化率を+X%/-X%/0%形式でフォーマットする
   */
  static formatRateChange(change: number): string {
    if (change > 0) return `+${change}%`;
    if (change < 0) return `${change}%`;
    return '0%';
  }

  static getDayLabel(day: number): string {
    return DAY_LABELS[day] ?? '';
  }

  /**
   * 複数期間の遵守率から改善/悪化/安定を判定する
   */
  static calculateTrendDirection(rates: number[]): 'up' | 'down' | 'stable' {
    if (rates.length < 2) return 'stable';
    const first = rates[0];
    const last = rates[rates.length - 1];
    const diff = last - first;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }

  /**
   * 直近の変化率から次期間の遵守率を予測する(0-100制約)
   */
  static predictNextPeriodRate(previousRate: number, currentRate: number): number {
    const change = currentRate - previousRate;
    const predicted = currentRate + change;
    return Math.max(0, Math.min(100, predicted));
  }

  /**
   * トレンド方向に応じた日本語サマリーを返す
   */
  static getTrendSummaryMessage(direction: 'up' | 'down' | 'stable'): string {
    const messages: Record<string, string> = {
      up: '服薬率が改善傾向にあります',
      down: '服薬率が低下傾向にあります',
      stable: '服薬率は安定しています',
    };
    return messages[direction];
  }

  /**
   * 2期間の遵守率を比較し、変化量と方向を返す
   */
  static comparePeriods(previousRate: number, currentRate: number): {
    change: number;
    changePercentage: number;
    direction: 'up' | 'down' | 'stable';
  } {
    const change = currentRate - previousRate;
    return {
      change,
      changePercentage: Math.abs(change),
      direction: AdherenceTrendEntity.calculateTrendDirection([previousRate, currentRate]),
    };
  }

  /**
   * 変化量に応じた改善メッセージを返す
   */
  static getImprovementMessage(change: number): string {
    if (change >= 15) return '大幅に改善しています。素晴らしいです';
    if (change > 0) return '少しずつ改善しています';
    if (change === 0) return '現状を維持できています';
    return '少し服薬率が下がっています。一緒に頑張りましょう';
  }

  /**
   * 複数期間の遵守率から安定度スコア(0-100)を算出する
   */
  static calculateConsistencyScore(rates: number[]): number {
    if (rates.length <= 1) return rates.length === 0 ? 0 : 100;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((sum, r) => sum + (r - avg) ** 2, 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    const maxStdDev = 50;
    return Math.round(Math.max(0, Math.min(100, 100 - (stdDev / maxStdDev) * 100)));
  }
}
