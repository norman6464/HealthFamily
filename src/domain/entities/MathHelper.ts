/**
 * 数値計算ヘルパー
 */
export class MathHelper {
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
}
