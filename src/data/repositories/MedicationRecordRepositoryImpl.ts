/**
 * 服薬記録リポジトリの実装
 */

import {
  MedicationRecordRepository,
  CreateRecordInput,
} from '../../domain/repositories/MedicationRecordRepository';
import { MedicationRecord } from '../../domain/entities/MedicationRecord';
import { recordApi } from '../api/recordApi';

export class MedicationRecordRepositoryImpl implements MedicationRecordRepository {
  async getHistory(): Promise<MedicationRecord[]> {
    return recordApi.getHistory();
  }

  async createRecord(input: CreateRecordInput): Promise<void> {
    await recordApi.createRecord(input);
  }
}
