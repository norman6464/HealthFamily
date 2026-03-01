/**
 * 病院リポジトリインターフェース
 */

import { Hospital } from '../entities/Hospital';

export interface CreateHospitalInput {
  name: string;
  type?: string;
  address?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateHospitalInput {
  name?: string;
  type?: string;
  address?: string;
  phone?: string;
  notes?: string;
}

export interface HospitalRepository {
  getHospitals(): Promise<Hospital[]>;
  createHospital(input: CreateHospitalInput): Promise<Hospital>;
  updateHospital(hospitalId: string, input: UpdateHospitalInput): Promise<Hospital>;
  deleteHospital(hospitalId: string): Promise<void>;
}
