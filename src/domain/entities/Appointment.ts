/**
 * 通院予約エンティティ
 */

import { DateRangeHelper } from './DateRange';
import { MathHelper } from './MathHelper';

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

/**
 * 通院予約のビジネスロジック
 */
export class AppointmentEntity {
  constructor(private readonly appointment: Appointment) {}

  /**
   * 予約が今日かどうか
   */
  isToday(): boolean {
    const today = DateRangeHelper.toStartOfDay(new Date());
    const date = DateRangeHelper.toStartOfDay(new Date(this.appointment.appointmentDate));
    return today.getTime() === date.getTime();
  }

  /**
   * 予約が過去かどうか
   */
  isPast(): boolean {
    const today = DateRangeHelper.toStartOfDay(new Date());
    const date = DateRangeHelper.toStartOfDay(new Date(this.appointment.appointmentDate));
    return date.getTime() < today.getTime();
  }

  /**
   * 予約日までの残り日数
   */
  daysUntil(): number {
    return DateRangeHelper.diffDays(new Date(), new Date(this.appointment.appointmentDate));
  }

  /**
   * 日本語のフォーマット済み日付
   */
  getFormattedDate(): string {
    const d = new Date(this.appointment.appointmentDate);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${DateRangeHelper.getDayOfWeekLabel(d)})`;
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
    medication_pickup: 'お薬',
    examination: '検査',
    flea_tick: 'ノミ・ダニ薬',
    heartworm: 'フィラリア',
    therapeutic_diet: '療養食',
    grooming: 'トリミング',
    other: 'その他',
  };

  getTypeLabel(): string {
    if (!this.appointment.appointmentType) return '';
    return AppointmentEntity.typeLabels[this.appointment.appointmentType] || this.appointment.appointmentType;
  }

  /**
   * 予約を種別ごとにカウントする
   */
  static countByType(appointments: Appointment[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const apt of appointments) {
      const type = apt.appointmentType || 'other';
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }

  /**
   * 今日以降の予約件数を返す
   */
  static getUpcomingCount(appointments: Appointment[], today: Date): number {
    const todayStart = DateRangeHelper.toStartOfDay(today);
    return appointments.filter((apt) => {
      const aptDate = DateRangeHelper.toStartOfDay(new Date(apt.appointmentDate));
      return aptDate.getTime() >= todayStart.getTime();
    }).length;
  }

  /**
   * リマインダーを送信すべきタイミングか判定
   */
  shouldRemind(): boolean {
    if (!this.appointment.reminderEnabled) return false;
    const days = this.daysUntil();
    if (days < 0) return false;
    return days <= this.appointment.reminderDaysBefore;
  }

  /**
   * 残り日数に応じたリマインダー緊急度を返す
   */
  static getReminderUrgency(daysUntil: number): 'urgent' | 'soon' | 'normal' | 'none' {
    if (daysUntil <= 1) return 'urgent';
    if (daysUntil <= 3) return 'soon';
    if (daysUntil <= 7) return 'normal';
    return 'none';
  }

  /**
   * 予約の状態ラベルを返す
   */
  getStatusLabel(): string {
    if (this.isPast()) return '完了';
    if (this.isToday()) return '本日';
    const days = this.daysUntil();
    if (days <= 3) return 'もうすぐ';
    return '予定';
  }

  get id(): string {
    return this.appointment.id;
  }

  get data(): Appointment {
    return this.appointment;
  }

  /**
   * 予約間の平均間隔（日数）を算出する
   */
  static getAverageInterval(appointments: Appointment[]): number | null {
    if (appointments.length <= 1) return null;
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    );
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalDays += DateRangeHelper.diffDays(
        new Date(sorted[i - 1].appointmentDate),
        new Date(sorted[i].appointmentDate),
      );
    }
    return Math.round(totalDays / (sorted.length - 1));
  }

  /**
   * 最終予約日と平均間隔から次回推奨日をYYYY-MM-DD形式で返す
   */
  static getNextRecommendedDate(lastDate: Date, intervalDays: number): string {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + intervalDays);
    return DateRangeHelper.toDateKey(date);
  }

  /**
   * 最も長い通院間隔を特定する
   */
  static getLongestGap(
    appointments: Appointment[],
  ): { days: number; from: string; to: string } | null {
    if (appointments.length <= 1) return null;
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    );
    let maxDays = 0;
    let maxFrom = sorted[0];
    let maxTo = sorted[1];
    for (let i = 1; i < sorted.length; i++) {
      const days = DateRangeHelper.diffDays(
        new Date(sorted[i - 1].appointmentDate),
        new Date(sorted[i].appointmentDate),
      );
      if (days > maxDays) {
        maxDays = days;
        maxFrom = sorted[i - 1];
        maxTo = sorted[i];
      }
    }
    return {
      days: maxDays,
      from: DateRangeHelper.toDateKey(new Date(maxFrom.appointmentDate)),
      to: DateRangeHelper.toDateKey(new Date(maxTo.appointmentDate)),
    };
  }

  /**
   * 予約種別ごとの件数と割合を算出する（多い順）
   */
  static getTypeDistribution(
    appointments: Appointment[],
  ): { type: string; label: string; count: number; percentage: number }[] {
    if (appointments.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const apt of appointments) {
      const type = apt.appointmentType || 'other';
      counts[type] = (counts[type] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        label: AppointmentEntity.typeLabels[type] || type,
        count,
        percentage: MathHelper.calculatePercentage(count, appointments.length),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 最も多い予約種別を返す
   */
  static getMostFrequentType(
    appointments: Appointment[],
  ): { type: string; label: string; count: number } | null {
    const dist = AppointmentEntity.getTypeDistribution(appointments);
    if (dist.length === 0) return null;
    return { type: dist[0].type, label: dist[0].label, count: dist[0].count };
  }

  /**
   * 特定種別の割合を算出する
   */
  static getTypePercentage(appointments: Appointment[], type: string): number {
    if (appointments.length === 0) return 0;
    const count = appointments.filter((a) => (a.appointmentType || 'other') === type).length;
    return MathHelper.calculatePercentage(count, appointments.length);
  }
}
