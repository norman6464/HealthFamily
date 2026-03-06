/**
 * 病院エンティティ
 */

import { DateRangeHelper } from './DateRange';

export interface Hospital {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly hospitalType?: string;
  readonly address?: string;
  readonly phoneNumber?: string;
  readonly notes?: string;
  readonly createdAt: Date;
}

/**
 * 病院のビジネスロジック
 */
export class HospitalEntity {
  private static readonly VISIT_REGULARITY_HIGH_THRESHOLD = 80;
  private static readonly VISIT_REGULARITY_MODERATE_THRESHOLD = 50;
  private static readonly VISIT_REGULARITY_MAX_CV = 100;

  private static readonly typeLabels: Record<string, string> = {
    general: '総合病院',
    clinic: 'クリニック',
    dental: '歯科',
    pharmacy: '薬局',
    veterinary: '動物病院',
  };

  /**
   * 病院種別コードを日本語ラベルに変換する
   */
  static getHospitalTypeLabel(type: string): string {
    return HospitalEntity.typeLabels[type] ?? type;
  }

  /**
   * 病院の表示情報をまとめて返す
   */
  static getDisplayInfo(hospital: {
    name: string;
    hospitalType?: string;
    address?: string;
    phoneNumber?: string;
  }): { name: string; typeLabel: string; address: string; phoneNumber: string } {
    return {
      name: hospital.name,
      typeLabel: hospital.hospitalType
        ? HospitalEntity.getHospitalTypeLabel(hospital.hospitalType)
        : '',
      address: hospital.address ?? '',
      phoneNumber: hospital.phoneNumber ?? '',
    };
  }

  /**
   * 電話番号を表示用にフォーマットする
   */
  static formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone || phone.trim() === '') return '-';
    if (phone.includes('-')) return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    return phone;
  }

  /**
   * 月間通院回数から通院頻度ラベルを返す
   */
  static formatVisitFrequency(timesPerMonth: number): string {
    if (timesPerMonth === 0) return '不定期';
    if (timesPerMonth === 1) return '毎月';
    if (timesPerMonth === 4) return '週1回';
    return `月${timesPerMonth}回`;
  }

  /**
   * 最終通院日からのラベルを生成する
   */
  static getLastVisitLabel(lastVisit: Date, today: Date): string {
    const diffDays = DateRangeHelper.diffDays(lastVisit, today);
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays === 7) return '1週間前';
    if (diffDays >= 28 && diffDays <= 31) return '1ヶ月前';
    if (diffDays > 31) return `${Math.round(diffDays / 30)}ヶ月前`;
    return `${diffDays}日前`;
  }

  /**
   * 最終通院からの日数に応じたステータスレベルを返す
   */
  static getVisitStatusLevel(daysSinceLastVisit: number): 'good' | 'warning' | 'alert' {
    if (daysSinceLastVisit <= 30) return 'good';
    if (daysSinceLastVisit <= 90) return 'warning';
    return 'alert';
  }

  /**
   * 訪問間隔（日数）から頻度ラベルを返す
   */
  static getVisitFrequencyLabel(intervalDays: number): string {
    if (intervalDays <= 0) return '毎日';
    if (intervalDays <= 7) return '週1回程度';
    if (intervalDays <= 14) return '2週に1回程度';
    if (intervalDays <= 31) return '月1回程度';
    if (intervalDays <= 180) return `${Math.round(intervalDays / 30)}ヶ月に1回程度`;
    return '年1回程度';
  }

  /**
   * 病院をタイプ別にグループ化する
   */
  static groupByType<T extends { hospitalType?: string }>(hospitals: T[]): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const h of hospitals) {
      const type = h.hospitalType ?? 'unknown';
      if (!result[type]) result[type] = [];
      result[type].push(h);
    }
    return result;
  }

  /**
   * タイプ別の分布を件数降順で返す
   */
  static getTypeDistribution(hospitals: { hospitalType?: string }[]): Array<{ type: string; label: string; count: number; percentage: number }> {
    if (hospitals.length === 0) return [];
    const groups = HospitalEntity.groupByType(hospitals);
    const total = hospitals.length;
    return Object.entries(groups)
      .map(([type, items]) => ({
        type,
        label: HospitalEntity.getHospitalTypeLabel(type),
        count: items.length,
        percentage: Math.round((items.length / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 通院日リストから月別通院回数を集計する
   */
  static getVisitCountByMonth(visits: { date: Date }[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const visit of visits) {
      const d = new Date(visit.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * 月別通院回数から月平均を算出する
   */
  static getAverageVisitsPerMonth(monthlyCounts: Record<string, number>): number {
    const months = Object.keys(monthlyCounts);
    if (months.length === 0) return 0;
    const total = Object.values(monthlyCounts).reduce((sum, c) => sum + c, 0);
    return Math.round((total / months.length) * 10) / 10;
  }

  /**
   * 月平均通院回数に応じた傾向ラベルを返す
   */
  static getVisitTrendLabel(avgPerMonth: number): string {
    if (avgPerMonth >= 4) return '頻繁';
    if (avgPerMonth >= 2) return '定期的';
    if (avgPerMonth > 0) return '少ない';
    return '通院なし';
  }

  /**
   * 通院間隔の規則性スコアを算出する（0-100）
   * 変動係数(CV)が小さいほどスコアが高い
   */
  static getVisitRegularityScore(intervalDays: number[]): number {
    if (intervalDays.length <= 1) return intervalDays.length === 0 ? 0 : 100;
    const avg = intervalDays.reduce((a, b) => a + b, 0) / intervalDays.length;
    if (avg === 0) return 0;
    const variance =
      intervalDays.reduce((sum, v) => sum + (v - avg) ** 2, 0) / intervalDays.length;
    const cv = (Math.sqrt(variance) / avg) * 100;
    return Math.max(
      0,
      Math.min(100, Math.round(100 - (cv / HospitalEntity.VISIT_REGULARITY_MAX_CV) * 100))
    );
  }

  /**
   * 通院規則性スコアに応じたラベルを返す
   */
  static getVisitRegularityScoreLabel(score: number): string {
    if (score >= HospitalEntity.VISIT_REGULARITY_HIGH_THRESHOLD) return '規則的';
    if (score >= HospitalEntity.VISIT_REGULARITY_MODERATE_THRESHOLD) return 'やや不規則';
    return '不規則';
  }
}
