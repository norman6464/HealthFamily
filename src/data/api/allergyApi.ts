import { Allergy } from '../../domain/entities/Allergy';
import { CreateAllergyInput, UpdateAllergyInput } from '../../domain/repositories/AllergyRepository';
import { apiClient } from './apiClient';
import { toAllergy } from './mappers';
import { BackendAllergy } from './types';

export const allergyApi = {
  async getAllergies(): Promise<Allergy[]> {
    const data = await apiClient.get<BackendAllergy[]>('/allergies');
    return data.map(toAllergy);
  },

  async createAllergy(input: CreateAllergyInput): Promise<Allergy> {
    const data = await apiClient.post<BackendAllergy>('/allergies', input);
    return toAllergy(data);
  },

  async updateAllergy(id: string, input: UpdateAllergyInput): Promise<Allergy> {
    const data = await apiClient.put<BackendAllergy>(`/allergies/${id}`, input);
    return toAllergy(data);
  },

  async deleteAllergy(id: string): Promise<void> {
    await apiClient.del(`/allergies/${id}`);
  },
};
