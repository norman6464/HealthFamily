import { Appointment } from '../../domain/entities/Appointment';
import { CreateAppointmentInput, UpdateAppointmentInput } from '../../domain/repositories/AppointmentRepository';
import { apiClient } from './apiClient';
import { toAppointment } from './mappers';
import { BackendAppointment } from './types';

export const appointmentApi = {
  async getAppointments(): Promise<Appointment[]> {
    const data = await apiClient.get<BackendAppointment[]>('/appointments');
    return data.map(toAppointment);
  },

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const data = await apiClient.post<BackendAppointment>('/appointments', input);
    return toAppointment(data);
  },

  async updateAppointment(appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const data = await apiClient.put<BackendAppointment>(`/appointments/${appointmentId}`, input);
    return toAppointment(data);
  },

  async deleteAppointment(appointmentId: string): Promise<void> {
    await apiClient.del(`/appointments/${appointmentId}`);
  },
};
