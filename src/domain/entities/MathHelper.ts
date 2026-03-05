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
}
