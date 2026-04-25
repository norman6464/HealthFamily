import { TemperatureRecord } from '../entities/TemperatureRecord';

export interface CreateTemperatureRecordInput {
  memberId: string;
  temperature: number;
  measuredAt: string;
  notes?: string;
}

export interface UpdateTemperatureRecordInput {
  temperature?: number;
  measuredAt?: string;
  notes?: string | null;
}

export interface TemperatureRecordRepository {
  findById(id: string): Promise<{ userId: string } | null>;
  getAll(): Promise<TemperatureRecord[]>;
  getByMember(memberId: string): Promise<TemperatureRecord[]>;
  create(input: CreateTemperatureRecordInput): Promise<TemperatureRecord>;
  update(id: string, input: UpdateTemperatureRecordInput): Promise<TemperatureRecord>;
  delete(id: string): Promise<void>;
}
