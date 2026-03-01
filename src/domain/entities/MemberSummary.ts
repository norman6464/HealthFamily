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
}
