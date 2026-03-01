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
}
