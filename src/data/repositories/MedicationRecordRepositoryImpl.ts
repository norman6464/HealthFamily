/**
 * 服薬記録リポジトリの実装
 */

import {
  MedicationRecordRepository,
  CreateRecordInput,
} from '../../domain/repositories/MedicationRecordRepository';
import { MedicationRecord } from '../../domain/entities/MedicationRecord';
import { AdherenceStats } from '../../domain/entities/AdherenceStats';
import { AdherenceTrend } from '../../domain/entities/AdherenceTrend';
import { recordApi } from '../api/recordApi';

export class MedicationRecordRepositoryImpl implements MedicationRecordRepository {
  async getHistory(): Promise<MedicationRecord[]> {
    return recordApi.getHistory();
  }

  async createRecord(input: CreateRecordInput): Promise<void> {
    await recordApi.createRecord(input);
  }

  async deleteRecord(recordId: string): Promise<void> {
    await recordApi.deleteRecord(recordId);
  }

  async getAdherenceStats(): Promise<AdherenceStats> {
    return recordApi.getStats();
  }

  async getAdherenceTrends(): Promise<AdherenceTrend> {
    return recordApi.getTrends();
  }
}
