/**
 * 病院エンティティ
 */

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
    const lastStart = new Date(lastVisit.getFullYear(), lastVisit.getMonth(), lastVisit.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffMs = todayStart.getTime() - lastStart.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
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
}
