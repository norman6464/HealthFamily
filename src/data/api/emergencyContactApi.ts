import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { CreateEmergencyContactInput, UpdateEmergencyContactInput } from '../../domain/repositories/EmergencyContactRepository';
import { apiClient } from './apiClient';
import { toEmergencyContact } from './mappers';
import { BackendEmergencyContact } from './types';

export const emergencyContactApi = {
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const data = await apiClient.get<BackendEmergencyContact[]>('/emergency-contacts');
    return data.map(toEmergencyContact);
  },

  async createEmergencyContact(input: CreateEmergencyContactInput): Promise<EmergencyContact> {
    const data = await apiClient.post<BackendEmergencyContact>('/emergency-contacts', input);
    return toEmergencyContact(data);
  },

  async updateEmergencyContact(id: string, input: UpdateEmergencyContactInput): Promise<EmergencyContact> {
    const data = await apiClient.put<BackendEmergencyContact>(`/emergency-contacts/${id}`, input);
    return toEmergencyContact(data);
  },

  async deleteEmergencyContact(id: string): Promise<void> {
    await apiClient.del(`/emergency-contacts/${id}`);
  },
};
