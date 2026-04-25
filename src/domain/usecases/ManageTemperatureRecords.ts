import { TemperatureRecord, TemperatureRecordEntity } from '../entities/TemperatureRecord';
import {
  TemperatureRecordRepository,
  CreateTemperatureRecordInput,
  UpdateTemperatureRecordInput,
} from '../repositories/TemperatureRecordRepository';

export class GetTemperatureRecords {
  constructor(private readonly repository: TemperatureRecordRepository) {}

  async execute(): Promise<TemperatureRecord[]> {
    return this.repository.getAll();
  }
}

export class GetTemperatureRecordsByMember {
  constructor(private readonly repository: TemperatureRecordRepository) {}

  async execute(memberId: string): Promise<TemperatureRecord[]> {
    if (!memberId) throw new Error('メンバーIDは必須です');
    return this.repository.getByMember(memberId);
  }
}

export class CreateTemperatureRecord {
  constructor(private readonly repository: TemperatureRecordRepository) {}

  async execute(input: CreateTemperatureRecordInput): Promise<TemperatureRecord> {
    if (!input.memberId) throw new Error('メンバーIDは必須です');
    if (!input.measuredAt) throw new Error('計測時刻は必須です');
    if (!TemperatureRecordEntity.isValidTemperature(input.temperature)) {
      throw new Error('体温は30.0〜45.0の範囲で指定してください');
    }
    return this.repository.create(input);
  }
}

export class UpdateTemperatureRecord {
  constructor(private readonly repository: TemperatureRecordRepository) {}

  async execute(id: string, input: UpdateTemperatureRecordInput): Promise<TemperatureRecord> {
    if (!id) throw new Error('記録IDは必須です');
    if (input.temperature !== undefined && !TemperatureRecordEntity.isValidTemperature(input.temperature)) {
      throw new Error('体温は30.0〜45.0の範囲で指定してください');
    }
    return this.repository.update(id, input);
  }
}

export class DeleteTemperatureRecord {
  constructor(private readonly repository: TemperatureRecordRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) throw new Error('記録IDは必須です');
    return this.repository.delete(id);
  }
}
