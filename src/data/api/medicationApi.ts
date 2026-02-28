import { Medication } from '../../domain/entities/Medication';
import { CreateMedicationInput, UpdateMedicationInput } from '../../domain/repositories/MedicationRepository';
import { apiClient } from './apiClient';
import { BackendMedication } from './types';
import { toMedication } from './mappers';

export const medicationApi = {
  async getMedicationsByMember(memberId: string): Promise<Medication[]> {
    const data = await apiClient.get<BackendMedication[]>(`/medications/member/${memberId}`);
    return data.map(toMedication);
  },

  async getMedicationById(medicationId: string): Promise<Medication | null> {
    try {
      const data = await apiClient.get<BackendMedication>(`/medications/${medicationId}`);
      return toMedication(data);
    } catch {
      return null;
    }
  },

  async createMedication(input: CreateMedicationInput): Promise<Medication> {
    const data = await apiClient.post<BackendMedication>('/medications', {
      name: input.name,
      memberId: input.memberId,
      category: input.category,
      dosageAmount: input.dosage,
      frequency: input.frequency,
      stockQuantity: input.stockQuantity,
      lowStockThreshold: input.lowStockThreshold,
      instructions: input.instructions,
    });
    return toMedication(data);
  },

  async updateMedication(medicationId: string, input: UpdateMedicationInput): Promise<Medication> {
    const body: Record<string, unknown> = {};
    if (input.stockQuantity !== undefined) body.stockQuantity = input.stockQuantity;
    if (input.name !== undefined) body.name = input.name;
    if (input.dosage !== undefined) body.dosageAmount = input.dosage;
    if (input.frequency !== undefined) body.frequency = input.frequency;
    if (input.lowStockThreshold !== undefined) body.lowStockThreshold = input.lowStockThreshold;
    if (input.instructions !== undefined) body.instructions = input.instructions;
    if (input.isActive !== undefined) body.isActive = input.isActive;

    const data = await apiClient.put<BackendMedication>(`/medications/${medicationId}`, body);
    return toMedication(data);
  },

  async deleteMedication(medicationId: string): Promise<void> {
    await apiClient.del(`/medications/${medicationId}`);
  },
};
