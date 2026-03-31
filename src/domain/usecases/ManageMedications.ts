/**
 * 薬管理ユースケース
 */

import { Medication, MedicationEntity } from '../entities/Medication';
import { MedicationSearchResult } from '../entities/MedicationSearchResult';
import { StockAlert } from '../entities/StockAlert';
import {
  MedicationRepository,
  CreateMedicationInput,
  UpdateMedicationInput,
} from '../repositories/MedicationRepository';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { ConflictError, NotFoundError } from '../errors';

/** @deprecated ConflictErrorを使用してください。v1.3.0で削除予定 */
export class DuplicateMedicationError extends ConflictError {}

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

/**
 * 薬を作成し、デフォルトスケジュールも同時に作成するユースケース
 * APIルート (POST /medications) で使用される
 */
export class CreateMedicationWithSchedule {
  constructor(
    private readonly medicationRepository: MedicationRepository,
    private readonly scheduleRepository: ScheduleRepository,
  ) {}

  async execute(input: CreateMedicationInput): Promise<Medication> {
    if (!input.name.trim()) {
      throw new Error('薬の名前は必須です');
    }

    // 同一メンバー内の重複チェック（アクティブな薬のみ）
    const existingMeds = await this.medicationRepository.getMedicationsByMember(input.memberId);
    const normalizedName = input.name.trim().toLowerCase();
    const duplicate = existingMeds.find((m) => m.isActive && m.name.trim().toLowerCase() === normalizedName);
    if (duplicate) {
      throw new DuplicateMedicationError('同じ名前のお薬が既に登録されています');
    }

    const medication = await this.medicationRepository.createMedication(input);

    try {
      await this.scheduleRepository.createSchedule({
        medicationId: medication.id,
        userId: input.userId,
        memberId: input.memberId,
        scheduledTime: '08:00',
        daysOfWeek: [],
        isEnabled: true,
        reminderMinutesBefore: 5,
      });
    } catch (error) {
      // スケジュール作成に失敗した場合、作成した薬を削除して整合性を保つ
      await this.medicationRepository.deleteMedication(medication.id);
      throw error;
    }

    return medication;
  }
}

export class UpdateMedication {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(medicationId: string, input: UpdateMedicationInput): Promise<Medication> {
    const existing = await this.medicationRepository.getMedicationById(medicationId);
    if (!existing) {
      throw new NotFoundError('薬が見つかりません');
    }
    return this.medicationRepository.updateMedication(medicationId, input);
  }
}

export class DeleteMedication {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(medicationId: string): Promise<void> {
    const existing = await this.medicationRepository.getMedicationById(medicationId);
    if (!existing) {
      throw new NotFoundError('薬が見つかりません');
    }
    return this.medicationRepository.deleteMedication(medicationId);
  }
}

export class ReorderMedications {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(medicationIds: string[]): Promise<void> {
    return this.medicationRepository.reorderMedications(medicationIds);
  }
}

export class SearchMedications {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(query: string): Promise<MedicationSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    return this.medicationRepository.searchMedications(trimmed);
  }
}

export class GetStockAlerts {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  async execute(): Promise<StockAlert[]> {
    return this.medicationRepository.getStockAlerts();
  }
}
