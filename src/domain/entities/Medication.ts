/**
 * お薬エンティティ
 */

import { DateRangeHelper } from './DateRange';

export type MedicationCategory =
  | 'regular'
  | 'supplement'
  | 'prn'
  | 'inhaler'
  | 'eye_drops'
  | 'patch'
  | 'topical'
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

  private static readonly LOW_STOCK_THRESHOLD = 5;
  private static readonly MEDIUM_STOCK_THRESHOLD = 10;
  private static readonly COMPLEXITY_MAX_MEDS = 10;
  private static readonly COMPLEXITY_MAX_TIMES = 6;
  private static readonly COMPLEXITY_MAX_TYPES = 5;
  private static readonly COMPLEXITY_HIGH_THRESHOLD = 70;
  private static readonly COMPLEXITY_MODERATE_THRESHOLD = 40;
  private static readonly COST_PER_DOSE_HIGH_THRESHOLD = 500;
  private static readonly COST_PER_DOSE_MODERATE_THRESHOLD = 100;
  private static readonly BURDEN_MAX_DAILY_DOSES = 10;
  private static readonly BURDEN_HIGH_THRESHOLD = 70;
  private static readonly BURDEN_MODERATE_THRESHOLD = 40;
  private static readonly WASTAGE_MAX_RATIO = 5;
  private static readonly WASTAGE_HIGH_THRESHOLD = 70;
  private static readonly WASTAGE_MODERATE_THRESHOLD = 40;
  private static readonly OVERLAP_MAX_MEDS = 8;
  private static readonly OVERLAP_HIGH_THRESHOLD = 70;
  private static readonly OVERLAP_MODERATE_THRESHOLD = 40;
  private static readonly DOSAGE_EFF_GOOD_THRESHOLD = 80;
  private static readonly DOSAGE_EFF_MODERATE_THRESHOLD = 50;

  private static readonly categoryLabels: Record<MedicationCategory, string> = {
    regular: '常用薬',
    supplement: 'サプリメント',
    prn: '頓服薬',
    inhaler: '吸入薬',
    eye_drops: '目薬',
    patch: '湿布',
    topical: '塗り薬',
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
    if (this.medication.stockQuantity <= MedicationEntity.LOW_STOCK_THRESHOLD) return 'low';
    return 'safe';
  }

  private static readonly STOCK_STATUS_LABELS: Record<string, string> = {
    safe: '十分',
    low: '残りわずか',
    critical: '在庫切れ',
    unknown: '未設定',
  };

  /**
   * 在庫状態の日本語ラベルを返す
   */
  static getStockStatusLabel(status: 'safe' | 'low' | 'critical' | 'unknown'): string {
    return MedicationEntity.STOCK_STATUS_LABELS[status];
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
  static isExpiringSoon(quantity: number | null, threshold: number = MedicationEntity.LOW_STOCK_THRESHOLD): boolean {
    if (quantity === null) return false;
    return quantity <= threshold;
  }

  /**
   * 在庫数に応じた補充推奨メッセージを返す
   */
  static getRefillRecommendation(quantity: number | null): string {
    if (quantity === null) return '在庫数が未設定です';
    if (quantity === 0) return '今すぐ補充が必要です';
    if (quantity <= MedicationEntity.LOW_STOCK_THRESHOLD) return '早めの補充をおすすめします';
    if (quantity <= MedicationEntity.MEDIUM_STOCK_THRESHOLD) return 'そろそろ補充を検討してください';
    return '十分な在庫があります';
  }

  private static readonly STOCK_STATUS_COLORS: Record<string, string> = {
    safe: 'text-green-600',
    low: 'text-orange-600',
    critical: 'text-red-600',
    unknown: 'text-gray-400',
  };

  /**
   * 在庫ステータスに応じたスタイルクラスを返す
   */
  static getStockStatusColor(status: 'safe' | 'low' | 'critical' | 'unknown'): string {
    return MedicationEntity.STOCK_STATUS_COLORS[status];
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

  /**
   * 服用頻度(回/日)から最小服用間隔(時間)を算出する
   */
  static getMinimumInterval(timesPerDay: number): number | null {
    if (timesPerDay <= 0) return null;
    return Math.floor(24 / timesPerDay);
  }

  /**
   * 前回服用からの経過時間が安全かチェックする
   */
  static isIntervalSafe(hoursSinceLastDose: number, timesPerDay: number): boolean {
    const minInterval = MedicationEntity.getMinimumInterval(timesPerDay);
    if (minInterval === null) return true;
    return hoursSinceLastDose >= minInterval;
  }

  /**
   * 間隔が不安全な場合に警告メッセージを返す
   */
  static getIntervalWarningMessage(hoursSinceLastDose: number, timesPerDay: number): string | null {
    if (MedicationEntity.isIntervalSafe(hoursSinceLastDose, timesPerDay)) return null;
    const minInterval = MedicationEntity.getMinimumInterval(timesPerDay);
    return `前回の服用から十分な時間が経っていません。最低${minInterval}時間の間隔をあけてください`;
  }

  /**
   * 薬の複雑さスコアを算出する（0-100）
   * 薬数・服用回数・種類数から算出
   */
  static getMedicationComplexityScore(
    medicationCount: number,
    timesPerDay: number,
    typeCount: number
  ): number {
    if (medicationCount <= 0 && timesPerDay <= 0 && typeCount <= 0) return 0;
    const medNorm = Math.min(medicationCount / MedicationEntity.COMPLEXITY_MAX_MEDS, 1);
    const timesNorm = Math.min(timesPerDay / MedicationEntity.COMPLEXITY_MAX_TIMES, 1);
    const typeNorm = Math.min(typeCount / MedicationEntity.COMPLEXITY_MAX_TYPES, 1);
    return Math.min(100, Math.round(((medNorm + timesNorm + typeNorm) / 3) * 100));
  }

  /**
   * 薬の複雑さスコアに応じたラベルを返す
   */
  static getMedicationComplexityScoreLabel(score: number): string {
    if (score >= MedicationEntity.COMPLEXITY_HIGH_THRESHOLD) return '複雑';
    if (score >= MedicationEntity.COMPLEXITY_MODERATE_THRESHOLD) return '普通';
    return 'シンプル';
  }

  /**
   * 総額と回数から1回あたりのコストを算出する
   */
  static getMedicationCostPerDose(totalCost: number, doseCount: number): number {
    if (totalCost <= 0 || doseCount <= 0) return 0;
    return Math.round((totalCost / doseCount) * 100) / 100;
  }

  /**
   * 1回あたりコストに応じたラベルを返す
   */
  static getMedicationCostPerDoseLabel(costPerDose: number): string {
    if (costPerDose >= MedicationEntity.COST_PER_DOSE_HIGH_THRESHOLD) return '高コスト';
    if (costPerDose >= MedicationEntity.COST_PER_DOSE_MODERATE_THRESHOLD) return '標準';
    return '低コスト';
  }

  /**
   * 1日の服薬回数から負担スコア(0-100)を算出する
   */
  static getMedicationBurdenScore(dailyDoses: number): number {
    if (dailyDoses <= 0) return 0;
    return Math.min(100, Math.round((dailyDoses / MedicationEntity.BURDEN_MAX_DAILY_DOSES) * 100));
  }

  /**
   * 服薬負担スコアに応じたラベルを返す
   */
  static getMedicationBurdenScoreLabel(score: number): string {
    if (score >= MedicationEntity.BURDEN_HIGH_THRESHOLD) return '負担大';
    if (score >= MedicationEntity.BURDEN_MODERATE_THRESHOLD) return '普通';
    return '負担小';
  }

  /**
   * 在庫数と残日数から在庫廃棄リスクスコア(0-100)を算出する
   * 在庫が多く残日数が少ないほど高スコア（廃棄リスクが高い）
   */
  static getStockWastageScore(stockQuantity: number, remainingDays: number): number {
    if (stockQuantity <= 0) return 0;
    if (remainingDays <= 0) return 100;
    const ratio = stockQuantity / remainingDays;
    return Math.min(100, Math.round((ratio / MedicationEntity.WASTAGE_MAX_RATIO) * 100));
  }

  /**
   * 在庫廃棄リスクスコアに応じたラベルを返す
   */
  static getStockWastageScoreLabel(score: number): string {
    if (score >= MedicationEntity.WASTAGE_HIGH_THRESHOLD) return '廃棄リスク高';
    if (score >= MedicationEntity.WASTAGE_MODERATE_THRESHOLD) return '注意';
    return '低リスク';
  }

  /**
   * 同時服用薬数から相互作用リスクスコア(0-100)を算出する
   */
  static getMedicationOverlapCount(concurrentMeds: number): number {
    if (concurrentMeds <= 0) return 0;
    return Math.min(100, Math.round((concurrentMeds / MedicationEntity.OVERLAP_MAX_MEDS) * 100));
  }

  /**
   * 同時服用薬数リスクスコアに応じたラベルを返す
   */
  static getMedicationOverlapCountLabel(score: number): string {
    if (score >= MedicationEntity.OVERLAP_HIGH_THRESHOLD) return 'リスク高';
    if (score >= MedicationEntity.OVERLAP_MODERATE_THRESHOLD) return '注意';
    return '安全';
  }

  /**
   * 実際の服薬量と処方量の比率から投薬効率(0-100)を算出する
   */
  static getDosageEfficiency(actualDose: number, prescribedDose: number): number {
    if (actualDose <= 0 || prescribedDose <= 0) return 0;
    return Math.min(100, Math.round((actualDose / prescribedDose) * 100));
  }

  /**
   * 投薬効率に応じたラベルを返す
   */
  static getDosageEfficiencyLabel(efficiency: number): string {
    if (efficiency >= MedicationEntity.DOSAGE_EFF_GOOD_THRESHOLD) return '良好';
    if (efficiency >= MedicationEntity.DOSAGE_EFF_MODERATE_THRESHOLD) return '普通';
    return '不足';
  }
}
