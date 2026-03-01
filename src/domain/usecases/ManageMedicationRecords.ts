/**
 * 服薬記録管理ユースケース
 */

import { MedicationRecordEntity, DailyRecordGroup } from '../entities/MedicationRecord';
import { AdherenceStats } from '../entities/AdherenceStats';
import { AdherenceTrend } from '../entities/AdherenceTrend';
import {
  MedicationRecordRepository,
  CreateRecordInput,
} from '../repositories/MedicationRecordRepository';

export class GetMedicationHistory {
  constructor(private readonly recordRepository: MedicationRecordRepository) {}

  async execute(): Promise<DailyRecordGroup[]> {
    const records = await this.recordRepository.getHistory();
    return MedicationRecordEntity.groupByDate(records);
  }
}

export class CreateMedicationRecord {
  constructor(private readonly recordRepository: MedicationRecordRepository) {}

  async execute(input: CreateRecordInput): Promise<void> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.medicationId) {
      throw new Error('薬IDは必須です');
    }
    return this.recordRepository.createRecord(input);
  }
}

export class DeleteMedicationRecord {
  constructor(private readonly recordRepository: MedicationRecordRepository) {}

  async execute(recordId: string): Promise<void> {
    if (!recordId) {
      throw new Error('記録IDは必須です');
    }
    return this.recordRepository.deleteRecord(recordId);
  }
}

export class GetAdherenceStats {
  constructor(private readonly recordRepository: MedicationRecordRepository) {}

  async execute(): Promise<AdherenceStats> {
    return this.recordRepository.getAdherenceStats();
  }
}

export class GetAdherenceTrends {
  constructor(private readonly recordRepository: MedicationRecordRepository) {}

  async execute(): Promise<AdherenceTrend> {
    return this.recordRepository.getAdherenceTrends();
  }
}
