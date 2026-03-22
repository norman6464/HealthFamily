/**
 * 薬リポジトリインターフェース
 */

import { Medication, MedicationCategory } from '../entities/Medication';
import { MedicationSearchResult } from '../entities/MedicationSearchResult';
import { StockAlert } from '../entities/StockAlert';

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
  category?: string;
  dosage?: string | null;
  frequency?: string | null;
  stockQuantity?: number | null;
  stockAlertDate?: string | null;
  instructions?: string | null;
  isActive?: boolean;
}

export interface MedicationRepository {
  getMedicationsByMember(memberId: string): Promise<Medication[]>;
  getMedicationById(medicationId: string): Promise<Medication | null>;
  createMedication(input: CreateMedicationInput): Promise<Medication>;
  updateMedication(medicationId: string, input: UpdateMedicationInput): Promise<Medication>;
  deleteMedication(medicationId: string): Promise<void>;
  reorderMedications(medicationIds: string[]): Promise<void>;
  searchMedications(query: string): Promise<MedicationSearchResult[]>;
  getStockAlerts(): Promise<StockAlert[]>;
}
