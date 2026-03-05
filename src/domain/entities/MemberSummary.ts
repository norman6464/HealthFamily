/**
 * メンバーサマリーエンティティ
 */

export interface MemberSummary {
  readonly memberId: string;
  readonly memberName: string;
  readonly memberType: string;
  readonly medicationCount: number;
  readonly nextAppointmentDate: string | null;
}

export class MemberSummaryEntity {
  constructor(private readonly summary: MemberSummary) {}

  get data(): MemberSummary {
    return this.summary;
  }

  hasUpcomingAppointment(): boolean {
    return this.summary.nextAppointmentDate !== null;
  }

  getDaysUntilAppointment(): number | null {
    if (!this.summary.nextAppointmentDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(this.summary.nextAppointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);
    return Math.ceil((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  getAppointmentLabel(): string {
    const days = this.getDaysUntilAppointment();
    if (days === null) return '';
    if (days === 0) return '今日';
    if (days === 1) return '明日';
    return `${days}日後`;
  }

  /**
   * 薬が登録されているか判定
   */
  hasMedications(): boolean {
    return this.summary.medicationCount > 0;
  }

  /**
   * 薬・予約の登録状況に応じたアクティビティレベルを返す
   */
  getActivityLevel(): 'active' | 'moderate' | 'inactive' {
    const hasMeds = this.hasMedications();
    const hasAppt = this.hasUpcomingAppointment();
    if (hasMeds && hasAppt) return 'active';
    if (hasMeds || hasAppt) return 'moderate';
    return 'inactive';
  }

  /**
   * メンバー種別の日本語ラベルを返す
   */
  static getMemberTypeLabel(memberType: string): string {
    const labels: Record<string, string> = {
      human: '家族',
      pet: 'ペット',
    };
    return labels[memberType] ?? memberType;
  }
}
