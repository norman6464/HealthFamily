import { Prescription } from '../../domain/entities/Prescription';
import { CreatePrescriptionInput, UpdatePrescriptionInput } from '../../domain/repositories/PrescriptionRepository';
import { apiClient } from './apiClient';
import { toPrescription } from './mappers';
import { BackendPrescription } from './types';

export const prescriptionApi = {
  async getPrescriptions(): Promise<Prescription[]> {
    const data = await apiClient.get<BackendPrescription[]>('/prescriptions');
    return data.map(toPrescription);
  },

  async createPrescription(input: CreatePrescriptionInput): Promise<Prescription> {
    const data = await apiClient.post<BackendPrescription>('/prescriptions', input);
    return toPrescription(data);
  },

  async updatePrescription(id: string, input: UpdatePrescriptionInput): Promise<Prescription> {
    const data = await apiClient.put<BackendPrescription>(`/prescriptions/${id}`, input);
    return toPrescription(data);
  },

  async deletePrescription(id: string): Promise<void> {
    await apiClient.del(`/prescriptions/${id}`);
  },
};
