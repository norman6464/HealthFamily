import { TemperatureRecord } from '../../domain/entities/TemperatureRecord';
import {
  CreateTemperatureRecordInput,
  UpdateTemperatureRecordInput,
} from '../../domain/repositories/TemperatureRecordRepository';
import { apiClient } from './apiClient';
import { toTemperatureRecord } from './mappers';
import { BackendTemperatureRecord } from './types';

export const temperatureRecordApi = {
  async getAll(): Promise<TemperatureRecord[]> {
    const data = await apiClient.get<BackendTemperatureRecord[]>('/temperature-records');
    return data.map(toTemperatureRecord);
  },

  async getByMember(memberId: string): Promise<TemperatureRecord[]> {
    const data = await apiClient.get<BackendTemperatureRecord[]>(
      `/temperature-records/member/${encodeURIComponent(memberId)}`,
    );
    return data.map(toTemperatureRecord);
  },

  async create(input: CreateTemperatureRecordInput): Promise<TemperatureRecord> {
    const data = await apiClient.post<BackendTemperatureRecord>('/temperature-records', input);
    return toTemperatureRecord(data);
  },

  async update(id: string, input: UpdateTemperatureRecordInput): Promise<TemperatureRecord> {
    const data = await apiClient.put<BackendTemperatureRecord>(
      `/temperature-records/${encodeURIComponent(id)}`,
      input,
    );
    return toTemperatureRecord(data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.del(`/temperature-records/${encodeURIComponent(id)}`);
  },
};
