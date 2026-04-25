import {
  TemperatureRecordRepository,
  CreateTemperatureRecordInput,
  UpdateTemperatureRecordInput,
} from '../../domain/repositories/TemperatureRecordRepository';
import { TemperatureRecord } from '../../domain/entities/TemperatureRecord';
import { temperatureRecordApi } from '../api/temperatureRecordApi';

export class TemperatureRecordRepositoryImpl implements TemperatureRecordRepository {
  async findById(_id: string): Promise<{ userId: string } | null> {
    throw new Error('findById はサーバーサイド専用です');
  }

  async getAll(): Promise<TemperatureRecord[]> {
    return temperatureRecordApi.getAll();
  }

  async getByMember(memberId: string): Promise<TemperatureRecord[]> {
    return temperatureRecordApi.getByMember(memberId);
  }

  async create(input: CreateTemperatureRecordInput): Promise<TemperatureRecord> {
    return temperatureRecordApi.create(input);
  }

  async update(id: string, input: UpdateTemperatureRecordInput): Promise<TemperatureRecord> {
    return temperatureRecordApi.update(id, input);
  }

  async delete(id: string): Promise<void> {
    return temperatureRecordApi.delete(id);
  }
}
