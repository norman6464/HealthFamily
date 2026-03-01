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
}
