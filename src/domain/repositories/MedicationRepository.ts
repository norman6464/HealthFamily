/**
 * 薬リポジトリインターフェース
 */

import { Medication, MedicationCategory } from '../entities/Medication';

export interface CreateMedicationInput {
  memberId: string;
  userId: string;
  name: string;
  category: MedicationCategory;
  dosage?: string;
  frequency?: string;
  stockQuantity?: number;
  stockAlertDate?: string;
  instructions?: string;
}

export interface UpdateMedicationInput {
  name?: string;
  dosage?: string;
  frequency?: string;
  stockQuantity?: number;
  stockAlertDate?: string;
  instructions?: string;
  isActive?: boolean;
}

export interface MedicationRepository {
  getMedicationsByMember(memberId: string): Promise<Medication[]>;
  getMedicationById(medicationId: string): Promise<Medication | null>;
  createMedication(input: CreateMedicationInput): Promise<Medication>;
  updateMedication(medicationId: string, input: UpdateMedicationInput): Promise<Medication>;
  deleteMedication(medicationId: string): Promise<void>;
}
