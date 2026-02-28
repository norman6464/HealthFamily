/**
 * 薬リポジトリの実装
 */

import {
  MedicationRepository,
  CreateMedicationInput,
  UpdateMedicationInput,
} from '../../domain/repositories/MedicationRepository';
import { Medication } from '../../domain/entities/Medication';
import { medicationApi } from '../api/medicationApi';

export class MedicationRepositoryImpl implements MedicationRepository {
  async getMedicationsByMember(memberId: string): Promise<Medication[]> {
    return medicationApi.getMedicationsByMember(memberId);
  }

  async getMedicationById(medicationId: string): Promise<Medication | null> {
    return medicationApi.getMedicationById(medicationId);
  }

  async createMedication(input: CreateMedicationInput): Promise<Medication> {
    return medicationApi.createMedication(input);
  }

  async updateMedication(medicationId: string, input: UpdateMedicationInput): Promise<Medication> {
    return medicationApi.updateMedication(medicationId, input);
  }

  async deleteMedication(medicationId: string): Promise<void> {
    return medicationApi.deleteMedication(medicationId);
  }
}
