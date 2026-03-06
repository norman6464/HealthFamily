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
      categoryLabel: MedicationEntity.getCategoryLabel(this.medication.category),
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

  private static readonly frequencyLabels: Record<string, string> = {
    daily: '毎日',
    twice_daily: '1日2回',
    three_times_daily: '1日3回',
    weekly: '週1回',
    as_needed: '必要時',
  };

  /**
   * 服薬頻度コードを日本語ラベルに変換する
   */
  static getFrequencyLabel(frequency: string): string {
    return MedicationEntity.frequencyLabels[frequency] ?? frequency;
  }

  /**
   * 在庫が補充推奨レベルかどうかを判定する
   */
  static isExpiringSoon(quantity: number | null, threshold: number = 5): boolean {
    if (quantity === null) return false;
    return quantity <= threshold;
  }

  /**
   * 在庫数に応じた補充推奨メッセージを返す
   */
  static getRefillRecommendation(quantity: number | null): string {
    if (quantity === null) return '在庫数が未設定です';
    if (quantity === 0) return '今すぐ補充が必要です';
    if (quantity <= 5) return '早めの補充をおすすめします';
    if (quantity <= 10) return 'そろそろ補充を検討してください';
    return '十分な在庫があります';
  }

  /**
   * 在庫ステータスに応じたスタイルクラスを返す
   */
  static getStockStatusColor(status: 'safe' | 'low' | 'critical' | 'unknown'): string {
    const colors: Record<string, string> = {
      safe: 'text-green-600',
      low: 'text-orange-600',
      critical: 'text-red-600',
      unknown: 'text-gray-400',
    };
    return colors[status];
  }

  /**
   * カテゴリと在庫数からサマリーテキストを生成する
   */
  static getMedicationSummary(category: MedicationCategory, stockQuantity: number | undefined): string {
    const catLabel = MedicationEntity.getCategoryLabel(category);
    if (stockQuantity === undefined) return `${catLabel} / 在庫: 未設定`;
    if (stockQuantity === 0) return `${catLabel} / 在庫切れ`;
    return `${catLabel} / 在庫: ${stockQuantity}`;
  }

  /**
   * アクティブフラグの日本語ラベルを返す
   */
  static getActiveStatusLabel(isActive: boolean): string {
    return isActive ? '有効' : '無効';
  }

  /**
   * 頻度コードが有効か検証する
   */
  static validateFrequency(frequency: string): boolean {
    return frequency in MedicationEntity.frequencyLabels;
  }

  /**
   * 全頻度の一覧を返す
   */
  static getAllFrequencies(): Array<{ id: string; label: string }> {
    return Object.entries(MedicationEntity.frequencyLabels).map(([id, label]) => ({
      id,
      label,
    }));
  }

  /**
   * 頻度と用量のサマリーテキストを返す
   */
  /**
   * 用量と単位を結合してフォーマットする
   */
  static formatDosageWithUnit(amount: number, unit: string): string {
    return `${amount}${unit}`;
  }

  /**
   * 1回の用量と1日の回数から日あたり総用量を算出する
   */
  static getDailyDosageTotal(dosagePerTime: number, timesPerDay: number): number {
    return dosagePerTime * timesPerDay;
  }

  /**
   * 日用量の注意レベルを判定する
   */
  static getDosageWarningLevel(dailyTotal: number): 'normal' | 'medium' | 'high' {
    if (dailyTotal >= 10) return 'high';
    if (dailyTotal >= 5) return 'medium';
    return 'normal';
  }

  static getFrequencySummary(frequency?: string, dosage?: string): string {
    const parts: string[] = [];
    if (frequency) {
      parts.push(MedicationEntity.getFrequencyLabel(frequency));
    }
    if (dosage) {
      parts.push(dosage);
    }
    return parts.join(' / ');
  }

  /**
   * 2つの薬が同カテゴリかチェックする
   */
  static isSameCategory(cat1: string, cat2: string): boolean {
    return cat1 === cat2;
  }

  /**
   * 薬リストをカテゴリ別にグループ化する
   */
  static groupByCategory<T extends { category: string }>(medications: T[]): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const med of medications) {
      if (!groups[med.category]) {
        groups[med.category] = [];
      }
      groups[med.category].push(med);
    }
    return groups;
  }

  /**
   * カテゴリ別の件数サマリーを返す
   */
  static getCategoryCountSummary<T extends { category: MedicationCategory }>(
    medications: T[],
  ): Array<{ category: MedicationCategory; label: string; count: number }> {
    const groups = MedicationEntity.groupByCategory(medications);
    return Object.entries(groups).map(([category, meds]) => ({
      category: category as MedicationCategory,
      label: MedicationEntity.getCategoryLabel(category as MedicationCategory),
      count: meds.length,
    }));
  }
}
