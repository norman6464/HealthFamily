import { Vaccination } from '../../domain/entities/Vaccination';
import { CreateVaccinationInput, UpdateVaccinationInput } from '../../domain/repositories/VaccinationRepository';
import { apiClient } from './apiClient';
import { toVaccination } from './mappers';
import { BackendVaccination } from './types';

export const vaccinationApi = {
  async getVaccinations(): Promise<Vaccination[]> {
    const data = await apiClient.get<BackendVaccination[]>('/vaccinations');
    return data.map(toVaccination);
  },

  async createVaccination(input: CreateVaccinationInput): Promise<Vaccination> {
    const data = await apiClient.post<BackendVaccination>('/vaccinations', input);
    return toVaccination(data);
  },

  async updateVaccination(vaccinationId: string, input: UpdateVaccinationInput): Promise<Vaccination> {
    const data = await apiClient.put<BackendVaccination>(`/vaccinations/${vaccinationId}`, input);
    return toVaccination(data);
  },

  async deleteVaccination(vaccinationId: string): Promise<void> {
    await apiClient.del(`/vaccinations/${vaccinationId}`);
  },
};
