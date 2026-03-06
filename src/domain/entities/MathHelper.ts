/**
 * 数値計算ヘルパー
 */
export class MathHelper {
  private static readonly WEIGHTED_AVG_VERY_HIGH_THRESHOLD = 90;
  private static readonly WEIGHTED_AVG_HIGH_THRESHOLD = 70;
  private static readonly WEIGHTED_AVG_NORMAL_THRESHOLD = 40;

  /**
   * パーセントを算出(0-100%)
   * @param numerator 分子
   * @param denominator 分母
   * @param cap trueの場合100%を上限にする
   */
  static calculatePercentage(numerator: number, denominator: number, cap: boolean = false): number {
    if (denominator <= 0) return 0;
    const result = Math.round((numerator / denominator) * 100);
    return cap ? Math.min(100, result) : result;
  }

  /**
   * 数値配列の平均値を算出する
   * @param values 数値配列
   * @param decimals 小数点以下の桁数（デフォルト1）
   */
  static calculateAverage(values: number[], decimals: number = 1): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const factor = Math.pow(10, decimals);
    return Math.round((sum / values.length) * factor) / factor;
  }

  /**
   * 数値配列の中央値を算出する
   */
  static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * 数値を指定範囲内に制約する
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 標準偏差を算出する（母集団標準偏差）
   */
  static calculateStdDev(values: number[]): number {
    if (values.length <= 1) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
    return Math.round(Math.sqrt(variance) * 100) / 100;
  }

  /**
   * 最頻値を算出する（同頻度の場合は最初の値）
   */
  static calculateMode(values: number[]): number | null {
    if (values.length === 0) return null;
    const counts = new Map<number, number>();
    for (const v of values) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    let maxCount = 0;
    let mode = values[0];
    for (const [value, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mode = value;
      }
    }
    return mode;
  }

  /**
   * ばらつき度合いのラベルを返す
   */
  static getVariabilityLabel(stdDev: number): string {
    if (stdDev <= 1) return '安定';
    if (stdDev < 3) return 'やや不安定';
    return '不安定';
  }

  /**
   * 指定ウィンドウの移動平均を算出する
   */
  static calculateMovingAverage(values: number[], window: number): number[] {
    if (values.length < window || window <= 0) return [];
    const result: number[] = [];
    for (let i = 0; i <= values.length - window; i++) {
      const slice = values.slice(i, i + window);
      const avg = slice.reduce((a, b) => a + b, 0) / window;
      result.push(Math.round(avg * 10) / 10);
    }
    return result;
  }

  /**
   * 前後の値から変化率(%)を算出する
   */
  static calculateChangeRate(previous: number, current: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * 変化率に応じたラベルを返す
   */
  static getChangeRateLabel(changeRate: number): string {
    if (changeRate >= 10) return '上昇';
    if (changeRate <= -10) return '下降';
    return '横ばい';
  }

  /**
   * パーセンタイルを算出する
   */
  static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    if (percentile <= 0) return sorted[0];
    if (percentile >= 100) return sorted[sorted.length - 1];
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  /**
   * 四分位数（Q1/Q2/Q3）を算出する
   */
  static getQuartiles(values: number[]): { q1: number; q2: number; q3: number } {
    return {
      q1: MathHelper.calculatePercentile(values, 25),
      q2: MathHelper.calculatePercentile(values, 50),
      q3: MathHelper.calculatePercentile(values, 75),
    };
  }

  /**
   * IQRに基づく外れ値判定の境界を返す
   */
  static getOutlierBounds(values: number[]): { lower: number; upper: number } {
    if (values.length === 0) return { lower: 0, upper: 0 };
    const { q1, q3 } = MathHelper.getQuartiles(values);
    const iqr = q3 - q1;
    return {
      lower: q1 - 1.5 * iqr,
      upper: q3 + 1.5 * iqr,
    };
  }

  /**
   * 加重平均を算出する
   */
  static getWeightedAverage(values: number[], weights: number[]): number {
    const len = Math.min(values.length, weights.length);
    if (len === 0) return 0;
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < len; i++) {
      weightedSum += values[i] * weights[i];
      totalWeight += weights[i];
    }
    if (totalWeight === 0) return 0;
    return weightedSum / totalWeight;
  }

  /**
   * 加重平均値に応じたラベルを返す
   */
  static getWeightedAverageLabel(value: number): string {
    if (value >= MathHelper.WEIGHTED_AVG_VERY_HIGH_THRESHOLD) return '非常に高い';
    if (value >= MathHelper.WEIGHTED_AVG_HIGH_THRESHOLD) return '高い';
    if (value >= MathHelper.WEIGHTED_AVG_NORMAL_THRESHOLD) return '普通';
    return '低い';
  }
}
