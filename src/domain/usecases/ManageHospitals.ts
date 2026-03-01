/**
 * 病院管理ユースケース
 */

import { Hospital } from '../entities/Appointment';
import {
  HospitalRepository,
  CreateHospitalInput,
} from '../repositories/HospitalRepository';

export class GetHospitals {
  constructor(private readonly hospitalRepository: HospitalRepository) {}

  async execute(): Promise<Hospital[]> {
    return this.hospitalRepository.getHospitals();
  }
}

export class CreateHospital {
  constructor(private readonly hospitalRepository: HospitalRepository) {}

  async execute(input: CreateHospitalInput): Promise<Hospital> {
    if (!input.name.trim()) {
      throw new Error('病院名は必須です');
    }
    return this.hospitalRepository.createHospital(input);
  }
}

export class DeleteHospital {
  constructor(private readonly hospitalRepository: HospitalRepository) {}

  async execute(hospitalId: string): Promise<void> {
    return this.hospitalRepository.deleteHospital(hospitalId);
  }
}
