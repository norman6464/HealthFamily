/**
 * 通院予約管理ユースケース
 */

import { Appointment, AppointmentEntity } from '../entities/Appointment';
import {
  AppointmentRepository,
  CreateAppointmentInput,
} from '../repositories/AppointmentRepository';

export interface AppointmentViewModel {
  appointment: Appointment;
  entity: AppointmentEntity;
}

export class GetAppointments {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(): Promise<AppointmentViewModel[]> {
    const appointments = await this.appointmentRepository.getAppointments();
    return appointments.map((apt) => ({
      appointment: apt,
      entity: new AppointmentEntity(apt),
    }));
  }
}

export class CreateAppointment {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.appointmentDate) {
      throw new Error('予約日は必須です');
    }
    return this.appointmentRepository.createAppointment(input);
  }
}

export class DeleteAppointment {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(appointmentId: string): Promise<void> {
    return this.appointmentRepository.deleteAppointment(appointmentId);
  }
}
