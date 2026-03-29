/**
 * 病院リポジトリの実装
 */

import {
  HospitalRepository,
  CreateHospitalInput,
  UpdateHospitalInput,
} from '../../domain/repositories/HospitalRepository';
import { Hospital } from '../../domain/entities/Hospital';
import { hospitalApi } from '../api/hospitalApi';

export class HospitalRepositoryImpl implements HospitalRepository {
  async findById(_id: string): Promise<{ userId: string } | null> {
    throw new Error('findById はサーバーサイド専用です');
  }

  async getHospitals(): Promise<Hospital[]> {
    return hospitalApi.getHospitals();
  }

  async createHospital(input: CreateHospitalInput): Promise<Hospital> {
    return hospitalApi.createHospital(input);
  }

  async updateHospital(hospitalId: string, input: UpdateHospitalInput): Promise<Hospital> {
    return hospitalApi.updateHospital(hospitalId, input);
  }

  async deleteHospital(hospitalId: string): Promise<void> {
    return hospitalApi.deleteHospital(hospitalId);
  }
}
