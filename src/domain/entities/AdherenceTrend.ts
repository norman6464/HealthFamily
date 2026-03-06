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
    const change = this.trend.rateChange;
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
}
