/**
 * 通院予約リポジトリインターフェース
 */

import { Appointment } from '../entities/Appointment';

export interface CreateAppointmentInput {
  memberId: string;
  hospitalId?: string;
  appointmentDate: string;
  type?: string;
  notes?: string;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
}

export interface UpdateAppointmentInput {
  appointmentDate?: string;
  type?: string;
  notes?: string;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
}

export interface AppointmentRepository {
  getAppointments(): Promise<Appointment[]>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  updateAppointment(appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment>;
  deleteAppointment(appointmentId: string): Promise<void>;
}
