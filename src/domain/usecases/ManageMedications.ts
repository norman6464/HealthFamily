/**
 * 薬管理ユースケース
 */

import { Medication, MedicationEntity } from '../entities/Medication';
import {
  MedicationRepository,
  CreateMedicationInput,
} from '../repositories/MedicationRepository';

export interface MedicationViewModel {
  medication: Medication;
  isLowStock: boolean;
  displayInfo: { name: string; categoryLabel: string; dosageInfo: string };
}

export class GetMedications {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(memberId: string): Promise<MedicationViewModel[]> {
    const medications = await this.medicationRepository.getMedicationsByMember(memberId);
    return medications.map((med) => {
      const entity = new MedicationEntity(med);
      return {
        medication: med,
        isLowStock: entity.isLowStock(),
        displayInfo: entity.getDisplayInfo(),
      };
    });
  }
}

export class CreateMedication {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(input: CreateMedicationInput): Promise<Medication> {
    if (!input.name.trim()) {
      throw new Error('薬の名前は必須です');
    }
    return this.medicationRepository.createMedication(input);
  }
}

export class DeleteMedication {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(medicationId: string): Promise<void> {
    const existing = await this.medicationRepository.getMedicationById(medicationId);
    if (!existing) {
      throw new Error('薬が見つかりません');
    }
    return this.medicationRepository.deleteMedication(medicationId);
  }
}
