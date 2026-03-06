/**
 * 在庫アラートエンティティ
 */

import { DateRangeHelper } from './DateRange';
import { MathHelper } from './MathHelper';

export interface StockAlert {
  readonly medicationId: string;
  readonly medicationName: string;
  readonly memberId: string;
  readonly memberName: string;
  readonly stockQuantity: number | null;
  readonly stockAlertDate: string;
  readonly daysUntilAlert: number;
  readonly isOverdue: boolean;
  readonly remainingDays?: number | null;
}

export class StockAlertEntity {
  private static readonly CRITICAL_DAYS_THRESHOLD = 3;
  private static readonly WARNING_DAYS_THRESHOLD = 7;
  private static readonly COST_LOW_THRESHOLD = 1000;
  private static readonly COST_STANDARD_THRESHOLD = 5000;
  private static readonly COST_MODERATE_THRESHOLD = 10000;
  private static readonly DAYS_PER_MONTH = 30;
  private static readonly DEPLETION_COMFORT_THRESHOLD = 14;
  private static readonly STOCK_TREND_THRESHOLD = 2;
  private static readonly ROTATION_HIGH_THRESHOLD = 2;
  private static readonly ROTATION_NORMAL_THRESHOLD = 1;
  private static readonly COVERAGE_SUFFICIENT_THRESHOLD = 70;
  private static readonly COVERAGE_LOW_THRESHOLD = 40;
  private static readonly STOCK_EFFICIENCY_HIGH_THRESHOLD = 80;
  private static readonly STOCK_EFFICIENCY_NORMAL_THRESHOLD = 50;
  private static readonly STABILITY_MAX_CV = 1;
  private static readonly STABILITY_HIGH_THRESHOLD = 80;
  private static readonly STABILITY_MODERATE_THRESHOLD = 50;
  private static readonly BURN_RATE_MAX_DAYS = 90;
  private static readonly BURN_RATE_HIGH_THRESHOLD = 70;
  private static readonly BURN_RATE_MODERATE_THRESHOLD = 40;
  private static readonly TURNOVER_HIGH_THRESHOLD = 2;
  private static readonly TURNOVER_MODERATE_THRESHOLD = 0.5;

  constructor(private readonly alert: StockAlert) {}

  /**
   * 緊急度を返す（3日以内 or 期限超過）
   */
  isUrgent(): boolean {
    return this.alert.isOverdue || this.alert.daysUntilAlert <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD;
  }

  /**
   * 残り日数のラベルを返す
   */
  getDaysLabel(): string {
    if (this.alert.isOverdue) return '期限超過';
    return `あと${this.alert.daysUntilAlert}日`;
  }

  get data(): StockAlert {
    return this.alert;
  }

  /**
   * 在庫数と1日消費量から残日数を算出（切り捨て）
   */
  static calculateRemainingDays(stockQuantity: number | null, dailyConsumption: number): number | null {
    if (stockQuantity === null) return null;
    if (dailyConsumption <= 0) return null;
    return Math.floor(stockQuantity / dailyConsumption);
  }

  /**
   * 残日数のラベルを生成
   */
  static getRemainingDaysLabel(remainingDays: number | null): string {
    if (remainingDays === null) return '残量不明';
    if (remainingDays === 0) return '在庫切れ';
    return `約${remainingDays}日分`;
  }

  /**
   * アラートを優先度順にソート（期限超過優先→残日数少順）
   */
  static sortByPriority(alerts: StockAlert[]): StockAlert[] {
    return [...alerts].sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return a.daysUntilAlert - b.daysUntilAlert;
    });
  }

  /**
   * 残日数に応じた緊急度ラベルを返す
   */
  static getUrgencyLabel(daysUntilAlert: number): string {
    if (daysUntilAlert <= 0) return '期限超過';
    if (daysUntilAlert <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD) return '残りわずか';
    if (daysUntilAlert <= StockAlertEntity.WARNING_DAYS_THRESHOLD) return '注意';
    return '余裕あり';
  }

  /**
   * 残日数に応じたスタイルクラスを返す
   */
  static getUrgencyStyle(daysUntilAlert: number): { bg: string; text: string } {
    if (daysUntilAlert <= 0) return { bg: 'bg-red-50', text: 'text-red-600' };
    if (daysUntilAlert <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD) return { bg: 'bg-orange-50', text: 'text-orange-600' };
    if (daysUntilAlert <= StockAlertEntity.WARNING_DAYS_THRESHOLD) return { bg: 'bg-yellow-50', text: 'text-yellow-600' };
    return { bg: 'bg-green-50', text: 'text-green-600' };
  }

  /**
   * 在庫切れ予測日をYYYY-MM-DD形式で返す
   */
  static predictStockoutDate(
    stockQuantity: number | null,
    dailyConsumption: number,
    baseDate: Date,
  ): string | null {
    if (stockQuantity === null || dailyConsumption <= 0) return null;
    const daysLeft = Math.floor(stockQuantity / dailyConsumption);
    const date = new Date(baseDate);
    date.setDate(date.getDate() + daysLeft);
    return DateRangeHelper.toDateKey(date);
  }

  /**
   * 目標日数に対する在庫充足率(0-100)を返す
   */
  static getStockSufficiencyRate(
    stockQuantity: number | null,
    dailyConsumption: number,
    targetDays: number,
  ): number {
    if (stockQuantity === null) return 0;
    if (dailyConsumption <= 0 || targetDays <= 0) return 100;
    const needed = dailyConsumption * targetDays;
    return MathHelper.calculatePercentage(stockQuantity, needed, true);
  }

  /**
   * 充足率に応じたラベルを返す
   */
  static getStockSufficiencyLabel(rate: number): string {
    if (rate >= 70) return '十分';
    if (rate >= 40) return 'やや不足';
    return '不足';
  }

  /**
   * 期間内の1日あたりの消費量を算出する
   */
  static getConsumptionRate(consumed: number, days: number): number | null {
    if (days <= 0) return null;
    return Math.round((consumed / days) * 100) / 100;
  }

  /**
   * 消費量の増減傾向を判定する（10%以内はstable）
   */
  static getConsumptionTrend(
    currentRate: number,
    previousRate: number,
  ): 'increasing' | 'decreasing' | 'stable' {
    if (previousRate === 0 && currentRate === 0) return 'stable';
    if (previousRate === 0) return 'increasing';
    const changeRate = Math.abs(currentRate - previousRate) / previousRate;
    if (changeRate <= 0.1) return 'stable';
    return currentRate > previousRate ? 'increasing' : 'decreasing';
  }

  /**
   * 目標日数に対する最適発注量を算出する
   */
  static getOptimalOrderQuantity(
    dailyConsumption: number,
    targetDays: number,
    currentStock: number,
  ): number {
    if (dailyConsumption <= 0) return 0;
    const needed = Math.ceil(dailyConsumption * targetDays);
    return Math.max(0, needed - currentStock);
  }

  /**
   * 緊急度別のアラート件数を集計する
   */
  static getAlertSummary(alerts: StockAlert[]): { urgent: number; warning: number; normal: number } {
    const summary = { urgent: 0, warning: 0, normal: 0 };
    for (const alert of alerts) {
      if (alert.isOverdue || alert.daysUntilAlert <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD) {
        summary.urgent++;
      } else if (alert.daysUntilAlert <= StockAlertEntity.WARNING_DAYS_THRESHOLD) {
        summary.warning++;
      } else {
        summary.normal++;
      }
    }
    return summary;
  }

  /**
   * 最も近いアラート日を返す
   */
  static getNextAlertDate(alerts: StockAlert[]): string | null {
    if (alerts.length === 0) return null;
    const sorted = [...alerts].sort((a, b) => a.stockAlertDate.localeCompare(b.stockAlertDate));
    return sorted[0].stockAlertDate;
  }

  /**
   * 残日数の日本語表示を返す
   */
  static formatRemainingDays(days: number): string {
    if (days < 0) return `${Math.abs(days)}日超過`;
    if (days === 0) return '今日';
    if (days % 30 === 0 && days >= 30) return `あと${days / 30}ヶ月`;
    if (days % 7 === 0 && days >= 7) return `あと${days / 7}週間`;
    return `あと${days}日`;
  }

  /**
   * 残日数に応じた在庫予測メッセージを返す
   */
  static getStockForecastMessage(remainingDays: number | null): string {
    if (remainingDays === null) return '在庫数が不明です';
    if (remainingDays === 0) return '在庫がありません';
    if (remainingDays <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD) return `あと${remainingDays}日分の在庫です。早急に補充してください`;
    if (remainingDays <= StockAlertEntity.WARNING_DAYS_THRESHOLD) return `あと${remainingDays}日分の在庫です。補充を検討してください`;
    return `あと${remainingDays}日分の在庫があります`;
  }

  /**
   * 補充の緊急度を判定する
   */
  static getRefillUrgency(remainingDays: number | null): 'critical' | 'urgent' | 'warning' | 'normal' | 'unknown' {
    if (remainingDays === null) return 'unknown';
    if (remainingDays === 0) return 'critical';
    if (remainingDays <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD) return 'urgent';
    if (remainingDays <= StockAlertEntity.WARNING_DAYS_THRESHOLD) return 'warning';
    return 'normal';
  }

  /**
   * 在庫切れまでの日数を算出する（calculateRemainingDaysに委譲）
   */
  static getDaysUntilStockout(stockQuantity: number | null, dailyConsumption: number): number | null {
    return StockAlertEntity.calculateRemainingDays(stockQuantity, dailyConsumption);
  }

  /**
   * 全体の在庫状況メッセージを生成する
   */
  static getOverallStockMessage(criticalCount: number, warningCount: number, cautionCount: number): string {
    if (criticalCount === 0 && warningCount === 0 && cautionCount === 0) {
      return '全ての在庫が十分です';
    }
    if (criticalCount > 0) {
      return `${criticalCount}件の緊急の在庫補充が必要です`;
    }
    if (warningCount > 0) {
      return `${warningCount}件の注意が必要な在庫があります`;
    }
    return `${cautionCount}件の在庫を確認してください`;
  }

  /**
   * 残り日数配列から緊急アラート件数を取得する（3日以下）
   */
  static getCriticalAlertCount(remainingDays: (number | null)[]): number {
    return remainingDays.filter((d) => d !== null && d <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD).length;
  }

  /**
   * 優先度に応じた対応メッセージを返す
   */
  static getAlertPriorityMessage(urgency: 'critical' | 'urgent' | 'warning' | 'normal'): string {
    const messages: Record<string, string> = {
      critical: '今すぐ補充してください',
      urgent: '早めに補充してください',
      warning: '計画的に補充を検討してください',
      normal: '在庫は十分です',
    };
    return messages[urgency];
  }

  /**
   * 補充コストの概算を返す（必要量 x 単価）
   */
  static estimateRefillCost(quantity: number, unitPrice: number): number {
    if (quantity <= 0 || unitPrice <= 0) return 0;
    return Math.ceil(quantity * unitPrice);
  }

  /**
   * 月間消費コストを算出する（日消費量 x 30日 x 単価）
   */
  static getMonthlyConsumptionCost(dailyConsumption: number, unitPrice: number): number {
    if (dailyConsumption <= 0 || unitPrice <= 0) return 0;
    return Math.round(dailyConsumption * StockAlertEntity.DAYS_PER_MONTH * unitPrice);
  }

  /**
   * 月間コストに応じた効率ラベルを返す
   */
  static getCostEfficiencyLabel(monthlyCost: number): string {
    if (monthlyCost < StockAlertEntity.COST_LOW_THRESHOLD) return '低コスト';
    if (monthlyCost < StockAlertEntity.COST_STANDARD_THRESHOLD) return '標準';
    if (monthlyCost < StockAlertEntity.COST_MODERATE_THRESHOLD) return 'やや高額';
    return '高額';
  }

  /**
   * 消費率から最適な補充日を算出する
   */
  static getOptimalRefillDate(
    currentStock: number,
    dailyConsumption: number,
    today: Date,
    bufferDays: number,
  ): Date | null {
    if (dailyConsumption <= 0) return null;
    const daysUntilEmpty = Math.floor(currentStock / dailyConsumption);
    const refillDays = Math.max(0, daysUntilEmpty - bufferDays);
    const refillDate = new Date(today);
    refillDate.setDate(refillDate.getDate() + refillDays);
    return refillDate;
  }

  /**
   * 推奨補充量を算出する
   */
  static getRefillQuantitySuggestion(dailyConsumption: number, targetDays: number): number {
    return Math.ceil(dailyConsumption * targetDays);
  }

  /**
   * 補充コスト見積もりを算出する
   */
  static getRefillCostEstimate(quantity: number, unitPrice: number): number {
    return Math.round(quantity * unitPrice);
  }

  /**
   * 月間コストに応じたカテゴリを返す
   */
  static getCostCategory(monthlyCost: number): 'low' | 'standard' | 'moderate' | 'high' {
    if (monthlyCost < StockAlertEntity.COST_LOW_THRESHOLD) return 'low';
    if (monthlyCost < StockAlertEntity.COST_STANDARD_THRESHOLD) return 'standard';
    if (monthlyCost < StockAlertEntity.COST_MODERATE_THRESHOLD) return 'moderate';
    return 'high';
  }

  /**
   * 在庫金額サマリーを算出する
   */
  static getStockValueSummary(
    items: { stockQuantity: number; unitPrice: number }[],
  ): { totalValue: number; itemCount: number } {
    const totalValue = items.reduce((sum, item) => sum + item.stockQuantity * item.unitPrice, 0);
    return { totalValue, itemCount: items.length };
  }

  /**
   * 消費量と購入量から廃棄率を算出する(0-100)
   */
  static getWastageRate(consumed: number, purchased: number): number | null {
    if (purchased <= 0) return null;
    if (consumed >= purchased) return 0;
    return Math.round(((purchased - consumed) / purchased) * 100);
  }

  /**
   * 廃棄率に応じたラベルを返す
   */
  static getWastageLabel(rate: number | null): string {
    if (rate === null) return 'データなし';
    if (rate <= 5) return '効率的';
    if (rate <= 15) return '許容範囲';
    if (rate <= 25) return '要改善';
    return '非効率';
  }

  /**
   * 在庫と日別消費量から枯渇までの日数を算出する
   */
  static getDepletionDays(stock: number, dailyConsumption: number): number | null {
    if (dailyConsumption <= 0) return null;
    return Math.floor(stock / dailyConsumption);
  }

  /**
   * 枯渇日数に応じた緊急度ラベルを返す
   */
  static getDepletionUrgencyLabel(days: number | null): string {
    if (days === null) return 'データなし';
    if (days <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD) return '緊急';
    if (days <= StockAlertEntity.WARNING_DAYS_THRESHOLD) return '注意';
    if (days <= StockAlertEntity.DEPLETION_COMFORT_THRESHOLD) return 'やや余裕';
    return '余裕あり';
  }

  /**
   * 複数薬の残日数から一括在庫ステータスを判定する
   */
  static getBulkStockStatus(items: { remainingDays: number }[]): string {
    if (items.length === 0) return 'データなし';
    const hasUrgent = items.some((i) => i.remainingDays <= StockAlertEntity.CRITICAL_DAYS_THRESHOLD);
    if (hasUrgent) return '緊急';
    const hasWarning = items.some((i) => i.remainingDays <= StockAlertEntity.WARNING_DAYS_THRESHOLD);
    if (hasWarning) return '注意';
    return '安心';
  }

  /**
   * 一括在庫ステータスに応じたメッセージを返す
   */
  static getBulkStockLabel(status: string): string {
    const labels: Record<string, string> = {
      '緊急': '早急に補充が必要です',
      '注意': 'そろそろ補充を検討してください',
      '安心': '在庫に余裕があります',
      'データなし': '在庫データがありません',
    };
    return labels[status] ?? '在庫データがありません';
  }

  /**
   * 残日数の少ない順にソートした補充推奨リストを返す
   */
  static getRefillRecommendation(
    items: { name: string; remainingDays: number }[],
  ): { name: string; remainingDays: number }[] {
    return [...items].sort((a, b) => a.remainingDays - b.remainingDays);
  }

  /**
   * 補充優先度の順位に応じたラベルを返す
   */
  /**
   * 在庫数量の推移配列からトレンドを判定する
   */
  static getStockTrend(quantities: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (quantities.length <= 1) return 'stable';
    const mid = Math.floor(quantities.length / 2);
    const firstHalf = quantities.slice(0, mid);
    const secondHalf = quantities.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (diff > StockAlertEntity.STOCK_TREND_THRESHOLD) return 'increasing';
    if (diff < -StockAlertEntity.STOCK_TREND_THRESHOLD) return 'decreasing';
    return 'stable';
  }

  /**
   * 在庫トレンドに応じたラベルを返す
   */
  static getStockTrendLabel(trend: string): string {
    const labels: Record<string, string> = {
      increasing: '在庫増加中',
      decreasing: '在庫減少中',
      stable: '在庫安定',
    };
    return labels[trend] ?? '在庫安定';
  }

  /**
   * 在庫回転率を算出する（消費量 / 平均在庫）
   */
  static getStockRotationRate(consumed: number, averageStock: number): number | null {
    if (averageStock <= 0) return null;
    if (consumed <= 0) return 0;
    return Math.round((consumed / averageStock) * 100) / 100;
  }

  /**
   * 在庫回転率に応じたラベルを返す
   */
  static getStockRotationLabel(rate: number | null): string {
    if (rate === null) return 'データなし';
    if (rate >= StockAlertEntity.ROTATION_HIGH_THRESHOLD) return '高回転';
    if (rate >= StockAlertEntity.ROTATION_NORMAL_THRESHOLD) return '適正';
    return '低回転';
  }

  /**
   * 在庫効率スコア(0-100)を算出する
   * 消費量/購入(在庫)量の割合をスコア化
   */
  static getStockEfficiencyScore(consumed: number, purchased: number): number {
    if (purchased <= 0 || consumed <= 0) return 0;
    return Math.min(100, Math.round((consumed / purchased) * 100));
  }

  /**
   * 在庫効率スコアに応じたラベルを返す
   */
  static getStockEfficiencyLabel(score: number): string {
    if (score >= StockAlertEntity.STOCK_EFFICIENCY_HIGH_THRESHOLD) return '効率的';
    if (score >= StockAlertEntity.STOCK_EFFICIENCY_NORMAL_THRESHOLD) return '標準';
    return '非効率';
  }

  static getRefillPriorityLabel(rank: number): string {
    if (rank === 1) return '最優先';
    if (rank === 2) return '優先';
    if (rank === 3) return '通常';
    return '低優先';
  }

  /**
   * 在庫カバレッジスコア(0-100)を算出する
   * 30日分を100%とし、在庫数/日消費量で算出
   */
  static getStockCoverageScore(stock: number, dailyConsumption: number): number {
    if (dailyConsumption <= 0) return 100;
    const coverageDays = stock / dailyConsumption;
    return Math.min(100, Math.max(0, Math.round((coverageDays / StockAlertEntity.DAYS_PER_MONTH) * 100)));
  }

  /**
   * 在庫カバレッジスコアに応じたラベルを返す
   */
  static getStockCoverageLabel(score: number): string {
    if (score >= StockAlertEntity.COVERAGE_SUFFICIENT_THRESHOLD) return '十分';
    if (score >= StockAlertEntity.COVERAGE_LOW_THRESHOLD) return 'やや不足';
    return '不足';
  }

  /**
   * 在庫量配列から安定性スコア(0-100)を算出する
   * 変動係数(CV)ベースで安定性を数値化
   */
  static getStockStabilityScore(stockLevels: number[]): number {
    if (stockLevels.length <= 1) return stockLevels.length === 0 ? 0 : 100;
    const avg = stockLevels.reduce((a, b) => a + b, 0) / stockLevels.length;
    if (avg === 0) return 0;
    const variance = stockLevels.reduce((sum, v) => sum + (v - avg) ** 2, 0) / stockLevels.length;
    const cv = Math.sqrt(variance) / avg;
    return Math.max(0, Math.min(100, Math.round(100 - (cv / StockAlertEntity.STABILITY_MAX_CV) * 100)));
  }

  /**
   * 在庫安定性スコアに応じたラベルを返す
   */
  static getStockStabilityLabel(score: number): string {
    if (score >= StockAlertEntity.STABILITY_HIGH_THRESHOLD) return '安定';
    if (score >= StockAlertEntity.STABILITY_MODERATE_THRESHOLD) return 'やや不安定';
    return '不安定';
  }

  /**
   * 在庫量と日次消費量から消費速度スコア(0-100)を算出する
   * 在庫日数が多いほど高スコア（最大90日基準）
   */
  static getStockBurnRate(stock: number, dailyConsumption: number): number {
    if (stock <= 0 || dailyConsumption <= 0) return 0;
    const coverageDays = stock / dailyConsumption;
    return Math.min(100, Math.round((coverageDays / StockAlertEntity.BURN_RATE_MAX_DAYS) * 100));
  }

  /**
   * 消費速度スコアに応じたラベルを返す
   */
  static getStockBurnRateLabel(score: number): string {
    if (score >= StockAlertEntity.BURN_RATE_HIGH_THRESHOLD) return '余裕あり';
    if (score >= StockAlertEntity.BURN_RATE_MODERATE_THRESHOLD) return 'やや不足';
    return '不足';
  }

  /**
   * 在庫回転率を算出する(消費量/平均在庫)
   */
  static getStockTurnoverRate(consumed: number, averageStock: number): number {
    if (consumed <= 0 || averageStock <= 0) return 0;
    return Math.round((consumed / averageStock) * 100) / 100;
  }

  /**
   * 在庫回転率に応じたラベルを返す
   */
  static getStockTurnoverRateLabel(rate: number): string {
    if (rate >= StockAlertEntity.TURNOVER_HIGH_THRESHOLD) return '高回転';
    if (rate >= StockAlertEntity.TURNOVER_MODERATE_THRESHOLD) return '普通';
    return '低回転';
  }
}
