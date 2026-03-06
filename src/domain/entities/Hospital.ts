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
}
