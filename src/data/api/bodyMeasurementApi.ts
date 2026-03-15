import { BodyMeasurement } from '../../domain/entities/BodyMeasurement';
import { CreateBodyMeasurementInput, UpdateBodyMeasurementInput } from '../../domain/repositories/BodyMeasurementRepository';
import { apiClient } from './apiClient';
import { toBodyMeasurement } from './mappers';
import { BackendBodyMeasurement } from './types';

export const bodyMeasurementApi = {
  async getBodyMeasurements(): Promise<BodyMeasurement[]> {
    const data = await apiClient.get<BackendBodyMeasurement[]>('/body-measurements');
    return data.map(toBodyMeasurement);
  },

  async createBodyMeasurement(input: CreateBodyMeasurementInput): Promise<BodyMeasurement> {
    const data = await apiClient.post<BackendBodyMeasurement>('/body-measurements', input);
    return toBodyMeasurement(data);
  },

  async updateBodyMeasurement(id: string, input: UpdateBodyMeasurementInput): Promise<BodyMeasurement> {
    const data = await apiClient.put<BackendBodyMeasurement>(`/body-measurements/${id}`, input);
    return toBodyMeasurement(data);
  },

  async deleteBodyMeasurement(id: string): Promise<void> {
    await apiClient.del(`/body-measurements/${id}`);
  },
};
