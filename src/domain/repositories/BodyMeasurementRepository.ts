import { BodyMeasurement } from '../entities/BodyMeasurement';

export interface CreateBodyMeasurementInput {
  memberId: string;
  weight?: number;
  height?: number;
  recordedAt: string;
  notes?: string;
}

export interface UpdateBodyMeasurementInput {
  weight?: number | null;
  height?: number | null;
  recordedAt?: string;
  notes?: string | null;
}

export interface BodyMeasurementRepository {
  getAll(): Promise<BodyMeasurement[]>;
  create(input: CreateBodyMeasurementInput): Promise<BodyMeasurement>;
  update(id: string, input: UpdateBodyMeasurementInput): Promise<BodyMeasurement>;
  delete(id: string): Promise<void>;
}
