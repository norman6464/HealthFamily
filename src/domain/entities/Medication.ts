/**
 * お薬エンティティ
 */

import { DateRangeHelper } from './DateRange';

export type MedicationCategory =
  | 'regular'
  | 'supplement'
  | 'prn'
  | 'inhaler'
  | 'flea_tick'
  | 'heartworm';

export interface Medication {
  readonly id: string;
  readonly memberId: string;
  readonly userId: string;
  readonly name: string;
  readonly category: MedicationCategory;
  readonly dosage?: string;
  readonly frequency?: string;
  readonly stockQuantity?: number;
  readonly stockAlertDate?: Date;
  readonly intervalHours?: number;
  readonly instructions?: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * お薬のビジネスロジック
 */
export class MedicationEntity {
  constructor(private readonly medication: Medication) {}

  /**
   * 在庫が少ないかチェック
   */
  isLowStock(): boolean {
    if (
      this.medication.stockQuantity === undefined ||
      this.medication.stockAlertDate === undefined
    ) {
      return false;
    }

    const daysUntilAlert = DateRangeHelper.diffDays(
      new Date(),
      new Date(this.medication.stockAlertDate),
    );

    if (daysUntilAlert <= 0) return false;

    return this.medication.stockQuantity < daysUntilAlert;
  }

  /**
   * 在庫を減らす
   */
  decreaseStock(amount: number = 1): Medication {
    if (this.medication.stockQuantity === undefined) {
      return this.medication;
    }

    return {
      ...this.medication,
      stockQuantity: Math.max(0, this.medication.stockQuantity - amount),
      updatedAt: new Date(),
    };
  }

  /**
   * 在庫を増やす
   */
  increaseStock(amount: number): Medication {
    if (this.medication.stockQuantity === undefined) {
      return this.medication;
    }

    return {
      ...this.medication,
      stockQuantity: this.medication.stockQuantity + amount,
      updatedAt: new Date(),
    };
  }

  get id(): string {
    return this.medication.id;
  }

  get name(): string {
    return this.medication.name;
  }

  get data(): Medication {
    return this.medication;
  }

  private static readonly categoryLabels: Record<MedicationCategory, string> = {
    regular: '常用薬',
    supplement: 'サプリメント',
    prn: '頓服薬',
    inhaler: '吸入薬',
    flea_tick: 'ノミ・ダニ薬',
    heartworm: 'フィラリア薬',
  };

  static getCategoryLabel(category: MedicationCategory): string {
    return MedicationEntity.categoryLabels[category] ?? category;
  }

  static getAllCategories(): Array<{ id: MedicationCategory; label: string }> {
    return Object.entries(MedicationEntity.categoryLabels).map(([id, label]) => ({
      id: id as MedicationCategory,
      label,
    }));
  }

  getDisplayInfo(): { name: string; categoryLabel: string; dosageInfo: string } {
    return {
      name: this.medication.name,
      categoryLabel: MedicationEntity.categoryLabels[this.medication.category],
      dosageInfo: this.getDosageSummary(),
    };
  }

  /**
   * 用量と頻度の統合表示文字列を返す
   */
  getDosageSummary(): string {
    const parts = [this.medication.dosage, this.medication.frequency].filter(Boolean);
    return parts.join(' / ');
  }

  /**
   * 在庫状態を判定する
   */
  getStockStatus(): 'safe' | 'low' | 'critical' | 'unknown' {
    if (this.medication.stockQuantity === undefined) return 'unknown';
    if (this.medication.stockQuantity === 0) return 'critical';
    if (this.medication.stockQuantity <= 5) return 'low';
    return 'safe';
  }

  /**
   * 在庫状態の日本語ラベルを返す
   */
  static getStockStatusLabel(status: 'safe' | 'low' | 'critical' | 'unknown'): string {
    const labels: Record<string, string> = {
      safe: '十分',
      low: '残りわずか',
      critical: '在庫切れ',
      unknown: '未設定',
    };
    return labels[status];
  }
}
