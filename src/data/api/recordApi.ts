import { MedicationRecord } from '../../domain/entities/MedicationRecord';
import { AdherenceStats } from '../../domain/entities/AdherenceStats';
import { apiClient } from './apiClient';
import { toMedicationRecord } from './mappers';
import { BackendRecord } from './types';

interface CreateRecordInput {
  memberId: string;
  medicationId: string;
  scheduleId?: string;
  notes?: string;
  dosageAmount?: string;
}

export const recordApi = {
  async createRecord(input: CreateRecordInput): Promise<BackendRecord> {
    return apiClient.post<BackendRecord>('/records', input);
  },

  async getHistory(): Promise<MedicationRecord[]> {
    const data = await apiClient.get<BackendRecord[]>('/records');
    return data.map(toMedicationRecord);
  },

  async deleteRecord(recordId: string): Promise<void> {
    await apiClient.del(`/records/${recordId}`);
  },

  async getStats(): Promise<AdherenceStats> {
    return apiClient.get<AdherenceStats>('/records/stats');
  },
};
