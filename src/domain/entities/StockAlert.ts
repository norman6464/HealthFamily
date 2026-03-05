/**
 * 在庫アラートエンティティ
 */

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
}
