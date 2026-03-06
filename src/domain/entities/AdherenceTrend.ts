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
  private static readonly GRADE_A_THRESHOLD = 80;
  private static readonly GRADE_B_THRESHOLD = 60;
  private static readonly GRADE_C_THRESHOLD = 40;
  private static readonly RATE_HIGH_THRESHOLD = 80;
  private static readonly RATE_MEDIUM_THRESHOLD = 50;
  private static readonly DISTRIBUTION_DOMINANT_THRESHOLD = 50;
  private static readonly FAILURES_WARNING_THRESHOLD = 3;
  private static readonly FAILURES_DANGER_THRESHOLD = 7;
  private static readonly WOW_CHANGE_THRESHOLD = 5;
  private static readonly ADHERENCE_VOLATILITY_MAX_DIFF = 50;
  private static readonly ADHERENCE_VOLATILITY_STABLE_THRESHOLD = 30;
  private static readonly ADHERENCE_VOLATILITY_MODERATE_THRESHOLD = 60;
  private static readonly RECOVERY_GOOD_THRESHOLD = 70;
  private static readonly RECOVERY_MODERATE_THRESHOLD = 40;
  private static readonly PEAK_EXCELLENT_THRESHOLD = 90;
  private static readonly PEAK_GOOD_THRESHOLD = 70;
  private static readonly PEAK_MODERATE_THRESHOLD = 50;
  private static readonly MOMENTUM_THRESHOLD = 5;

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

  /**
   * 連続達成日数の最長記録を算出する
   */
  static getLongestStreak(dailyResults: boolean[]): number {
    let longest = 0;
    let current = 0;
    for (const achieved of dailyResults) {
      if (achieved) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 0;
      }
    }
    return longest;
  }

  /**
   * 現在の連続達成日数を算出する(末尾から)
   */
  static getCurrentStreak(dailyResults: boolean[]): number {
    let streak = 0;
    for (let i = dailyResults.length - 1; i >= 0; i--) {
      if (dailyResults[i]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * ストリークに応じたラベルを返す
   */
  static getStreakLabel(days: number): string {
    if (days === 0) return '記録なし';
    if (days >= 30) return '1ヶ月連続';
    if (days >= 14 && days % 7 === 0) return `${days / 7}週間連続`;
    if (days === 7) return '1週間連続';
    return `${days}日連続`;
  }

  /**
   * 日別完了率から週別平均完了率を算出する
   */
  static getWeeklyCompletionRates(dailyRates: number[]): number[] {
    if (dailyRates.length === 0) return [];
    const weeks: number[] = [];
    for (let i = 0; i < dailyRates.length; i += 7) {
      const chunk = dailyRates.slice(i, i + 7);
      const avg = chunk.reduce((sum, r) => sum + r, 0) / chunk.length;
      weeks.push(Math.round(avg * 10) / 10);
    }
    return weeks;
  }

  /**
   * 週別完了率から推移傾向を判定する
   */
  static getCompletionTrend(weeklyRates: number[]): 'improving' | 'declining' | 'stable' {
    if (weeklyRates.length < 2) return 'stable';
    const first = weeklyRates[0];
    const last = weeklyRates[weeklyRates.length - 1];
    const diff = last - first;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  /**
   * 完了率に応じたラベルを返す
   */
  static getCompletionRateLabel(rate: number): string {
    if (rate >= 100) return '完璧';
    if (rate >= 90) return '優秀';
    if (rate >= 70) return '良好';
    if (rate >= 50) return '要改善';
    return '不十分';
  }

  /**
   * 目標達成率を算出する(0-100)
   */
  static getGoalProgress(current: number, goal: number): number {
    if (goal <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((current / goal) * 100)));
  }

  /**
   * 目標達成率に応じたラベルを返す
   */
  static getGoalProgressLabel(progress: number): string {
    if (progress >= 100) return '達成';
    if (progress >= 70) return 'あと少し';
    if (progress >= 40) return '半分';
    return '頑張りましょう';
  }

  /**
   * 遵守率と一貫性スコアからパフォーマンスグレード(A-D)を判定する
   */
  static getPerformanceGrade(rate: number, consistency: number): string {
    const combined = (rate + consistency) / 2;
    if (combined >= AdherenceTrendEntity.GRADE_A_THRESHOLD) return 'A';
    if (combined >= AdherenceTrendEntity.GRADE_B_THRESHOLD) return 'B';
    if (combined >= AdherenceTrendEntity.GRADE_C_THRESHOLD) return 'C';
    return 'D';
  }

  /**
   * パフォーマンスグレードに応じたラベルを返す
   */
  /**
   * 遵守率配列の分布（高/中/低の割合%）を算出する
   * 高: 80以上, 中: 50-79, 低: 50未満
   */
  static getRateDistribution(rates: number[]): { high: number; medium: number; low: number } {
    if (rates.length === 0) return { high: 0, medium: 0, low: 0 };
    let high = 0;
    let medium = 0;
    let low = 0;
    for (const rate of rates) {
      if (rate >= AdherenceTrendEntity.RATE_HIGH_THRESHOLD) high++;
      else if (rate >= AdherenceTrendEntity.RATE_MEDIUM_THRESHOLD) medium++;
      else low++;
    }
    const total = rates.length;
    return {
      high: Math.round((high / total) * 100),
      medium: Math.round((medium / total) * 100),
      low: Math.round((low / total) * 100),
    };
  }

  /**
   * 遵守率分布に応じたラベルを返す
   */
  static getRateDistributionLabel(dist: { high: number; medium: number; low: number }): string {
    if (dist.high >= AdherenceTrendEntity.DISTRIBUTION_DOMINANT_THRESHOLD) return '安定して高い';
    if (dist.low >= AdherenceTrendEntity.DISTRIBUTION_DOMINANT_THRESHOLD) return '改善が必要';
    return 'ばらつきあり';
  }

  /**
   * 末尾からの連続未達成回数を算出する
   */
  static getConsecutiveFailures(dailyResults: boolean[]): number {
    let count = 0;
    for (let i = dailyResults.length - 1; i >= 0; i--) {
      if (!dailyResults[i]) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * 連続未達成回数に応じたラベルを返す
   */
  static getConsecutiveFailuresLabel(count: number): string {
    if (count === 0) return '良好';
    if (count < AdherenceTrendEntity.FAILURES_WARNING_THRESHOLD) return '注意';
    if (count < AdherenceTrendEntity.FAILURES_DANGER_THRESHOLD) return '警告';
    return '危険';
  }

  static getPerformanceGradeLabel(grade: string): string {
    const labels: Record<string, string> = {
      A: '優秀',
      B: '良好',
      C: '要改善',
      D: '要注意',
    };
    return labels[grade] ?? '要注意';
  }

  /**
   * 遵守率配列から変動性スコア(0-100)を算出する
   * 隣接値の差分の平均をスコア化（最大差50基準）
   */
  static getAdherenceVolatility(rates: number[]): number {
    if (rates.length <= 1) return 0;
    let totalDiff = 0;
    for (let i = 1; i < rates.length; i++) {
      totalDiff += Math.abs(rates[i] - rates[i - 1]);
    }
    const avgDiff = totalDiff / (rates.length - 1);
    return Math.min(100, Math.round((avgDiff / AdherenceTrendEntity.ADHERENCE_VOLATILITY_MAX_DIFF) * 100));
  }

  /**
   * 変動性スコアに応じたラベルを返す
   */
  static getAdherenceVolatilityLabel(score: number): string {
    if (score <= AdherenceTrendEntity.ADHERENCE_VOLATILITY_STABLE_THRESHOLD) return '安定';
    if (score <= AdherenceTrendEntity.ADHERENCE_VOLATILITY_MODERATE_THRESHOLD) return 'やや不安定';
    return '不安定';
  }

  /**
   * 週次遵守率配列の直近2週間の変化量を算出する
   */
  static getWeekOverWeekChange(weeklyRates: number[]): number {
    if (weeklyRates.length < 2) return 0;
    return weeklyRates[weeklyRates.length - 1] - weeklyRates[weeklyRates.length - 2];
  }

  /**
   * 週次変化量に応じたラベルを返す
   */
  static getWeekOverWeekLabel(change: number): string {
    if (change >= AdherenceTrendEntity.WOW_CHANGE_THRESHOLD) return '改善';
    if (change <= -AdherenceTrendEntity.WOW_CHANGE_THRESHOLD) return '悪化';
    return '横ばい';
  }

  /**
   * 遵守率配列から回復率(0-100)を算出する
   * 低下後の最大回復割合を返す（低下がない場合は0）
   */
  static getAdherenceRecoveryRate(rates: number[]): number {
    if (rates.length <= 1) return 0;
    let maxRecoveryRate = 0;
    let i = 0;
    while (i < rates.length - 1) {
      // 低下を検出
      if (rates[i + 1] < rates[i]) {
        const peakValue = rates[i];
        let troughValue = rates[i + 1];
        let j = i + 2;
        // 最低値を探す
        while (j < rates.length && rates[j] <= troughValue) {
          troughValue = rates[j];
          j++;
        }
        const drop = peakValue - troughValue;
        if (drop > 0 && j < rates.length) {
          // 回復を探す
          let maxRecovery = 0;
          for (let k = j; k < rates.length; k++) {
            const recovery = rates[k] - troughValue;
            if (recovery > maxRecovery) maxRecovery = recovery;
          }
          const recoveryRate = Math.min(100, Math.round((maxRecovery / drop) * 100));
          if (recoveryRate > maxRecoveryRate) maxRecoveryRate = recoveryRate;
        }
        i = j;
      } else {
        i++;
      }
    }
    return maxRecoveryRate;
  }

  /**
   * 回復率に応じたラベルを返す
   */
  static getAdherenceRecoveryLabel(rate: number): string {
    if (rate >= AdherenceTrendEntity.RECOVERY_GOOD_THRESHOLD) return '良好';
    if (rate >= AdherenceTrendEntity.RECOVERY_MODERATE_THRESHOLD) return 'やや遅い';
    return '低回復';
  }

  /**
   * 遵守率配列からピーク値(最大値)を返す
   */
  static getAdherencePeakRate(rates: number[]): number {
    if (rates.length === 0) return 0;
    return Math.max(...rates);
  }

  /**
   * ピーク率に応じたラベルを返す
   */
  static getAdherencePeakLabel(rate: number): string {
    if (rate >= AdherenceTrendEntity.PEAK_EXCELLENT_THRESHOLD) return '優秀';
    if (rate >= AdherenceTrendEntity.PEAK_GOOD_THRESHOLD) return '良好';
    if (rate >= AdherenceTrendEntity.PEAK_MODERATE_THRESHOLD) return '普通';
    return '低調';
  }

  /**
   * 遵守率配列からモメンタム(変化の加速度)を算出する
   * 2次差分の平均を返す（3件未満は0）
   */
  static getAdherenceMomentum(rates: number[]): number {
    if (rates.length < 3) return 0;
    const diffs: number[] = [];
    for (let i = 1; i < rates.length; i++) {
      diffs.push(rates[i] - rates[i - 1]);
    }
    // 直近の変化を重視した加重平均
    let weightedSum = 0;
    let weightTotal = 0;
    for (let i = 0; i < diffs.length; i++) {
      const weight = i + 1;
      weightedSum += diffs[i] * weight;
      weightTotal += weight;
    }
    return Math.round((weightedSum / weightTotal) * 100) / 100;
  }

  /**
   * モメンタムに応じたラベルを返す
   */
  static getAdherenceMomentumLabel(momentum: number): string {
    if (momentum >= AdherenceTrendEntity.MOMENTUM_THRESHOLD) return '加速改善';
    if (momentum <= -AdherenceTrendEntity.MOMENTUM_THRESHOLD) return '加速悪化';
    return '安定';
  }
}
