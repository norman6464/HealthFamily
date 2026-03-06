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
  constructor(private readonly alert: StockAlert) {}

  /**
   * 緊急度を返す（3日以内 or 期限超過）
   */
  isUrgent(): boolean {
    return this.alert.isOverdue || this.alert.daysUntilAlert <= 3;
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
    if (daysUntilAlert <= 3) return '残りわずか';
    if (daysUntilAlert <= 7) return '注意';
    return '余裕あり';
  }

  /**
   * 残日数に応じたスタイルクラスを返す
   */
  static getUrgencyStyle(daysUntilAlert: number): { bg: string; text: string } {
    if (daysUntilAlert <= 0) return { bg: 'bg-red-50', text: 'text-red-600' };
    if (daysUntilAlert <= 3) return { bg: 'bg-orange-50', text: 'text-orange-600' };
    if (daysUntilAlert <= 7) return { bg: 'bg-yellow-50', text: 'text-yellow-600' };
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
      if (alert.isOverdue || alert.daysUntilAlert <= 3) {
        summary.urgent++;
      } else if (alert.daysUntilAlert <= 7) {
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
}
