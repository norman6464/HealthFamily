/**
 * 数値計算ヘルパー
 */
export class MathHelper {
  private static readonly WEIGHTED_AVG_VERY_HIGH_THRESHOLD = 90;
  private static readonly WEIGHTED_AVG_HIGH_THRESHOLD = 70;
  private static readonly WEIGHTED_AVG_NORMAL_THRESHOLD = 40;
  private static readonly NORMALIZED_HIGH_THRESHOLD = 80;
  private static readonly NORMALIZED_MEDIUM_THRESHOLD = 50;
  private static readonly NORMALIZED_LOW_THRESHOLD = 20;
  private static readonly CORRELATION_STRONG_THRESHOLD = 0.7;
  private static readonly CORRELATION_WEAK_THRESHOLD = 0.3;
  private static readonly OUTLIER_SEVERE_RATE = 0.2;
  private static readonly OUTLIER_MINOR_RATE = 0.05;
  private static readonly GEOMETRIC_HIGH_THRESHOLD = 70;
  private static readonly GEOMETRIC_LOW_THRESHOLD = 30;
  private static readonly ENTROPY_HIGH_THRESHOLD = 70;
  private static readonly ENTROPY_LOW_THRESHOLD = 30;
  private static readonly ZSCORE_ABNORMAL_THRESHOLD = 2;
  private static readonly ZSCORE_OUTLIER_THRESHOLD = 1;
  private static readonly COSINE_SIMILAR_THRESHOLD = 0.7;
  private static readonly COSINE_SOMEWHAT_THRESHOLD = 0.3;
  private static readonly COSINE_OPPOSITE_THRESHOLD = -0.7;
  private static readonly RANK_HIGH_THRESHOLD = 80;
  private static readonly RANK_MEDIUM_THRESHOLD = 50;

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

  /**
   * 任意の値を0-100の範囲に正規化する
   */
  static normalizeToRange(value: number, min: number, max: number): number {
    if (min >= max) return 100;
    const clamped = Math.max(min, Math.min(max, value));
    return Math.round(((clamped - min) / (max - min)) * 100);
  }

  /**
   * 正規化された値に応じたラベルを返す
   */
  static getNormalizedRangeLabel(value: number): string {
    if (value >= MathHelper.NORMALIZED_HIGH_THRESHOLD) return '高い';
    if (value >= MathHelper.NORMALIZED_MEDIUM_THRESHOLD) return '中程度';
    if (value >= MathHelper.NORMALIZED_LOW_THRESHOLD) return '低い';
    return '非常に低い';
  }

  /**
   * 2配列間のピアソン相関係数(-1〜1)を算出する
   */
  static getCorrelationCoefficient(x: number[], y: number[]): number {
    const len = Math.min(x.length, y.length);
    if (len <= 1) return 0;
    const avgX = x.slice(0, len).reduce((a, b) => a + b, 0) / len;
    const avgY = y.slice(0, len).reduce((a, b) => a + b, 0) / len;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    for (let i = 0; i < len; i++) {
      const dx = x[i] - avgX;
      const dy = y[i] - avgY;
      sumXY += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }
    const denominator = Math.sqrt(sumX2 * sumY2);
    if (denominator === 0) return 0;
    return Math.round((sumXY / denominator) * 100) / 100;
  }

  /**
   * 相関係数に応じたラベルを返す
   */
  static getCorrelationLabel(r: number): string {
    const abs = Math.abs(r);
    if (abs >= MathHelper.CORRELATION_STRONG_THRESHOLD) return r > 0 ? '強い正相関' : '強い負相関';
    if (abs >= MathHelper.CORRELATION_WEAK_THRESHOLD) return r > 0 ? '弱い正相関' : '弱い負相関';
    return '相関なし';
  }

  /**
   * IQRに基づいて外れ値の件数を返す
   */
  static getOutlierCount(values: number[]): number {
    if (values.length <= 1) return 0;
    const { lower, upper } = MathHelper.getOutlierBounds(values);
    return values.filter((v) => v < lower || v > upper).length;
  }

  /**
   * 外れ値の件数と全体数から深刻度ラベルを返す
   */
  static getOutlierSeverityLabel(outlierCount: number, total: number): string {
    if (total === 0 || outlierCount === 0) return '正常';
    const rate = outlierCount / total;
    if (rate >= MathHelper.OUTLIER_SEVERE_RATE) return '深刻';
    if (rate >= MathHelper.OUTLIER_MINOR_RATE) return '軽微';
    return '正常';
  }

  /**
   * 幾何平均を算出する（0以下の値を含む場合は0）
   */
  static getGeometricMean(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.some((v) => v <= 0)) return 0;
    const logSum = values.reduce((sum, v) => sum + Math.log(v), 0);
    const mean = Math.exp(logSum / values.length);
    return Math.round(mean * 100) / 100;
  }

  /**
   * 調和平均を算出する（0以下の値を含む場合は0）
   */
  static getHarmonicMean(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.some((v) => v <= 0)) return 0;
    const sumReciprocals = values.reduce((sum, v) => sum + 1 / v, 0);
    const mean = values.length / sumReciprocals;
    return Math.round(mean * 100) / 100;
  }

  /**
   * 調和平均に応じたラベルを返す
   */
  static getHarmonicMeanLabel(mean: number): string {
    if (mean >= MathHelper.GEOMETRIC_HIGH_THRESHOLD) return '高い';
    if (mean >= MathHelper.GEOMETRIC_LOW_THRESHOLD) return '中程度';
    return '低い';
  }

  /**
   * 幾何平均に応じたラベルを返す
   */
  /**
   * トリム平均を算出する（上下指定%を除外した平均）
   * @param values 数値配列
   * @param trimPercent 上下から除外する割合(0-49)
   */
  static getTrimmedMean(values: number[], trimPercent: number): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];
    const sorted = [...values].sort((a, b) => a - b);
    const trimCount = Math.floor(sorted.length * (trimPercent / 100));
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
    if (trimmed.length === 0) return sorted[Math.floor(sorted.length / 2)];
    const sum = trimmed.reduce((a, b) => a + b, 0);
    return Math.round((sum / trimmed.length) * 10) / 10;
  }

  /**
   * トリム平均値に応じたラベルを返す
   */
  static getTrimmedMeanLabel(mean: number): string {
    if (mean >= MathHelper.GEOMETRIC_HIGH_THRESHOLD) return '高い';
    if (mean >= MathHelper.GEOMETRIC_LOW_THRESHOLD) return '中程度';
    return '低い';
  }

  static getGeometricMeanLabel(mean: number): string {
    if (mean >= MathHelper.GEOMETRIC_HIGH_THRESHOLD) return '高い';
    if (mean >= MathHelper.GEOMETRIC_LOW_THRESHOLD) return '中程度';
    return '低い';
  }

  /**
   * 値配列のエントロピー(多様性)スコア(0-100)を算出する
   * シャノンエントロピーを最大エントロピーで正規化
   */
  static getEntropyScore(values: number[]): number {
    if (values.length <= 1) return 0;
    const counts = new Map<number, number>();
    for (const v of values) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    if (counts.size <= 1) return 0;
    const total = values.length;
    let entropy = 0;
    for (const count of counts.values()) {
      const p = count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    const maxEntropy = Math.log2(counts.size);
    if (maxEntropy === 0) return 0;
    return Math.round((entropy / maxEntropy) * 100);
  }

  /**
   * エントロピースコアに応じたラベルを返す
   */
  static getEntropyLabel(score: number): string {
    if (score >= MathHelper.ENTROPY_HIGH_THRESHOLD) return '多様';
    if (score >= MathHelper.ENTROPY_LOW_THRESHOLD) return '普通';
    return '均一';
  }

  /**
   * 値配列と対象値からZ値（標準化スコア）を算出する
   */
  static getZScore(values: number[], target: number): number {
    if (values.length <= 1) return 0;
    const stdDev = MathHelper.calculateStdDev(values);
    if (stdDev === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(((target - avg) / stdDev) * 100) / 100;
  }

  /**
   * Z値に応じた異常度ラベルを返す
   */
  static getZScoreLabel(z: number): string {
    const abs = Math.abs(z);
    if (abs >= MathHelper.ZSCORE_ABNORMAL_THRESHOLD) return '異常';
    if (abs >= MathHelper.ZSCORE_OUTLIER_THRESHOLD) return 'やや外れ値';
    return '正常';
  }

  /**
   * 2つの数値配列のコサイン類似度(-1〜1)を算出する
   */
  static getCosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    if (len === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    return Math.round((dotProduct / denominator) * 100) / 100;
  }

  /**
   * コサイン類似度に応じたラベルを返す
   */
  static getCosineSimilarityLabel(similarity: number): string {
    if (similarity >= MathHelper.COSINE_SIMILAR_THRESHOLD) return '類似';
    if (similarity >= MathHelper.COSINE_SOMEWHAT_THRESHOLD) return 'やや類似';
    if (similarity <= MathHelper.COSINE_OPPOSITE_THRESHOLD) return '正反対';
    return '無関係';
  }

  /**
   * 値配列中の対象値の順位百分率(0-100)を算出する
   * 対象値以下の値の割合を返す
   */
  static getRankPercentile(values: number[], target: number): number {
    if (values.length === 0) return 0;
    const belowCount = values.filter((v) => v < target).length;
    const equalCount = values.filter((v) => v === target).length;
    return Math.round(((belowCount + equalCount * 0.5) / values.length) * 100);
  }

  /**
   * 順位百分率に応じたラベルを返す
   */
  static getRankPercentileLabel(percentile: number): string {
    if (percentile >= MathHelper.RANK_HIGH_THRESHOLD) return '上位';
    if (percentile >= MathHelper.RANK_MEDIUM_THRESHOLD) return '中位';
    return '下位';
  }
}
