export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Schedule {
  scheduleId: string;
  medicationId: string;
  userId: string;
  memberId: string;
  scheduledTime: string;
  daysOfWeek: DayOfWeek[];
  isEnabled: boolean;
  reminderMinutesBefore: number;
  createdAt: string;
}
