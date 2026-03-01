/**
 * 通院予約エンティティ
 */

export interface Appointment {
  readonly id: string;
  readonly userId: string;
  readonly memberId: string;
  readonly memberName?: string;
  readonly hospitalId?: string;
  readonly hospitalName?: string;
  readonly appointmentType?: string;
  readonly appointmentDate: Date;
  readonly description?: string;
  readonly reminderEnabled: boolean;
  readonly reminderDaysBefore: number;
  readonly createdAt: Date;
}

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
 * 通院予約のビジネスロジック
 */
export class AppointmentEntity {
  constructor(private readonly appointment: Appointment) {}

  /**
   * 予約が今日かどうか
   */
  isToday(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(this.appointment.appointmentDate);
    date.setHours(0, 0, 0, 0);
    return today.getTime() === date.getTime();
  }

  /**
   * 予約が過去かどうか
   */
  isPast(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(this.appointment.appointmentDate);
    date.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  }

  /**
   * 予約日までの残り日数
   */
  daysUntil(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(this.appointment.appointmentDate);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 日本語のフォーマット済み日付
   */
  getFormattedDate(): string {
    const d = new Date(this.appointment.appointmentDate);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
  }

  /**
   * 種別ラベル
   */
  static readonly typeLabels: Record<string, string> = {
    checkup: '定期検診',
    treatment: '治療',
    vaccination: '予防接種',
    surgery: '手術',
    consultation: '相談',
    other: 'その他',
  };

  getTypeLabel(): string {
    if (!this.appointment.appointmentType) return '';
    return AppointmentEntity.typeLabels[this.appointment.appointmentType] || this.appointment.appointmentType;
  }

  get id(): string {
    return this.appointment.id;
  }

  get data(): Appointment {
    return this.appointment;
  }
}
