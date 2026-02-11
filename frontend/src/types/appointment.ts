export type AppointmentType = 'visit' | 'vaccine' | 'checkup';

export interface Appointment {
  appointmentId: string;
  userId: string;
  memberId: string;
  hospitalId?: string;
  appointmentType: AppointmentType;
  appointmentDate: string;
  description?: string;
  testResults?: string;
  cost?: number;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  createdAt: string;
}
