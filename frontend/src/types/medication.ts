export type MedicationCategory =
  | 'regular'
  | 'supplement'
  | 'prn'
  | 'flea_tick'
  | 'heartworm';

export interface Medication {
  medicationId: string;
  memberId: string;
  userId: string;
  name: string;
  category: MedicationCategory;
  dosage: string;
  frequency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  intervalHours?: number;
  instructions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RecordStatus = 'taken' | 'skipped' | 'late';

export interface MedicationRecord {
  recordId: string;
  memberId: string;
  medicationId: string;
  userId: string;
  takenAt: string;
  scheduledTime?: string;
  status: RecordStatus;
  notes?: string;
}
