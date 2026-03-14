import { Insurance } from '../../domain/entities/Insurance';
import { CreateInsuranceInput, UpdateInsuranceInput } from '../../domain/repositories/InsuranceRepository';
import { apiClient } from './apiClient';
import { toInsurance } from './mappers';
import { BackendInsurance } from './types';

export const insuranceApi = {
  async getInsurances(): Promise<Insurance[]> {
    const data = await apiClient.get<BackendInsurance[]>('/insurances');
    return data.map(toInsurance);
  },

  async createInsurance(input: CreateInsuranceInput): Promise<Insurance> {
    const data = await apiClient.post<BackendInsurance>('/insurances', input);
    return toInsurance(data);
  },

  async updateInsurance(id: string, input: UpdateInsuranceInput): Promise<Insurance> {
    const data = await apiClient.put<BackendInsurance>(`/insurances/${id}`, input);
    return toInsurance(data);
  },

  async deleteInsurance(id: string): Promise<void> {
    await apiClient.del(`/insurances/${id}`);
  },
};
