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
    return Math.round(dailyConsumption * 30 * unitPrice);
  }

  /**
   * 月間コストに応じた効率ラベルを返す
   */
  static getCostEfficiencyLabel(monthlyCost: number): string {
    if (monthlyCost < 1000) return '低コスト';
    if (monthlyCost < 5000) return '標準';
    if (monthlyCost < 10000) return 'やや高額';
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
}
