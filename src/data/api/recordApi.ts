import { apiClient } from './apiClient';
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

  async getRecords(): Promise<BackendRecord[]> {
    return apiClient.get<BackendRecord[]>('/records');
  },

  async getRecordsByMember(memberId: string): Promise<BackendRecord[]> {
    return apiClient.get<BackendRecord[]>(`/records/member/${memberId}`);
  },
};
