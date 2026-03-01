/**
 * 通院予約リポジトリの実装
 */

import {
  AppointmentRepository,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../../domain/repositories/AppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';
import { appointmentApi } from '../api/appointmentApi';

export class AppointmentRepositoryImpl implements AppointmentRepository {
  async getAppointments(): Promise<Appointment[]> {
    return appointmentApi.getAppointments();
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    return appointmentApi.createAppointment(input);
  }

  async updateAppointment(appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment> {
    return appointmentApi.updateAppointment(appointmentId, input);
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    return appointmentApi.deleteAppointment(appointmentId);
  }
}
