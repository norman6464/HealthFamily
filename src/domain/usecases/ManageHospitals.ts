/**
 * 病院管理ユースケース
 */

import { Hospital } from '../entities/Hospital';
import {
  HospitalRepository,
  CreateHospitalInput,
  UpdateHospitalInput,
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

export class UpdateHospital {
  constructor(private readonly hospitalRepository: HospitalRepository) {}

  async execute(hospitalId: string, input: UpdateHospitalInput): Promise<Hospital> {
    if (!hospitalId) {
      throw new Error('病院IDは必須です');
    }
    if (Object.keys(input).length === 0) {
      throw new Error('更新するフィールドがありません');
    }
    return this.hospitalRepository.updateHospital(hospitalId, input);
  }
}

export class DeleteHospital {
  constructor(private readonly hospitalRepository: HospitalRepository) {}

  async execute(hospitalId: string): Promise<void> {
    return this.hospitalRepository.deleteHospital(hospitalId);
  }
}
