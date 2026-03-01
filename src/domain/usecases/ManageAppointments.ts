/**
 * 通院予約管理ユースケース
 */

import { Appointment, AppointmentEntity } from '../entities/Appointment';
import {
  AppointmentRepository,
  CreateAppointmentInput,
  UpdateAppointmentInput,
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

export class UpdateAppointment {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment> {
    if (!appointmentId) {
      throw new Error('予約IDは必須です');
    }
    if (Object.keys(input).length === 0) {
      throw new Error('更新するフィールドがありません');
    }
    return this.appointmentRepository.updateAppointment(appointmentId, input);
  }
}

export class DeleteAppointment {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(appointmentId: string): Promise<void> {
    return this.appointmentRepository.deleteAppointment(appointmentId);
  }
}
