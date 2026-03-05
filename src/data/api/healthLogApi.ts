import { HealthLog } from '../../domain/entities/HealthLog';
import { apiClient } from './apiClient';
import { BackendHealthLog } from './types';
import { toHealthLog } from './mappers';

interface CreateHealthLogInput {
  memberId: string;
  conditionLevel: number;
  symptoms?: string[];
  notes?: string;
}

export const healthLogApi = {
  async getLogs(): Promise<HealthLog[]> {
    const data = await apiClient.get<BackendHealthLog[]>('/health-logs');
    return data.map(toHealthLog);
  },

  async createLog(input: CreateHealthLogInput): Promise<BackendHealthLog> {
    return apiClient.post<BackendHealthLog>('/health-logs', input);
  },

  async deleteLog(logId: string): Promise<void> {
    await apiClient.del(`/health-logs/${logId}`);
  },
};
