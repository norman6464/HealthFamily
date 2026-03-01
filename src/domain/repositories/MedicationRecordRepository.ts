/**
 * 服薬記録リポジトリインターフェース
 */

import { MedicationRecord } from '../entities/MedicationRecord';

export interface CreateRecordInput {
  memberId: string;
  medicationId: string;
  scheduleId?: string;
  notes?: string;
  dosageAmount?: string;
}

export interface MedicationRecordRepository {
  getHistory(): Promise<MedicationRecord[]>;
  createRecord(input: CreateRecordInput): Promise<void>;
}
