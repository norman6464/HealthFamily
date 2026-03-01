import { Hospital } from '../../domain/entities/Appointment';
import { apiClient } from './apiClient';
import { toHospital } from './mappers';
import { BackendHospital } from './types';

export interface CreateHospitalInput {
  name: string;
  type?: string;
  address?: string;
  phone?: string;
  notes?: string;
}

export const hospitalApi = {
  async getHospitals(): Promise<Hospital[]> {
    const data = await apiClient.get<BackendHospital[]>('/hospitals');
    return data.map(toHospital);
  },

  async createHospital(input: CreateHospitalInput): Promise<Hospital> {
    const data = await apiClient.post<BackendHospital>('/hospitals', input);
    return toHospital(data);
  },

  async deleteHospital(hospitalId: string): Promise<void> {
    await apiClient.del(`/hospitals/${hospitalId}`);
  },
};
