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
}
