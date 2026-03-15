import {
  BodyMeasurementRepository,
  CreateBodyMeasurementInput,
  UpdateBodyMeasurementInput,
} from '../../domain/repositories/BodyMeasurementRepository';
import { BodyMeasurement } from '../../domain/entities/BodyMeasurement';
import { bodyMeasurementApi } from '../api/bodyMeasurementApi';

export class BodyMeasurementRepositoryImpl implements BodyMeasurementRepository {
  async getAll(): Promise<BodyMeasurement[]> {
    return bodyMeasurementApi.getBodyMeasurements();
  }

  async create(input: CreateBodyMeasurementInput): Promise<BodyMeasurement> {
    return bodyMeasurementApi.createBodyMeasurement(input);
  }

  async update(id: string, input: UpdateBodyMeasurementInput): Promise<BodyMeasurement> {
    return bodyMeasurementApi.updateBodyMeasurement(id, input);
  }

  async delete(id: string): Promise<void> {
    return bodyMeasurementApi.deleteBodyMeasurement(id);
  }
}
