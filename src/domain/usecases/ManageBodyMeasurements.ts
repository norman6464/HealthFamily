import { BodyMeasurement } from '../entities/BodyMeasurement';
import {
  BodyMeasurementRepository,
  CreateBodyMeasurementInput,
  UpdateBodyMeasurementInput,
} from '../repositories/BodyMeasurementRepository';

export class GetBodyMeasurements {
  constructor(private readonly repository: BodyMeasurementRepository) {}

  async execute(): Promise<BodyMeasurement[]> {
    return this.repository.getAll();
  }
}

export class CreateBodyMeasurement {
  constructor(private readonly repository: BodyMeasurementRepository) {}

  async execute(input: CreateBodyMeasurementInput): Promise<BodyMeasurement> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.recordedAt) {
      throw new Error('記録日は必須です');
    }
    if (input.weight == null && input.height == null) {
      throw new Error('体重または身長のいずれかは必須です');
    }
    return this.repository.create(input);
  }
}

export class UpdateBodyMeasurement {
  constructor(private readonly repository: BodyMeasurementRepository) {}

  async execute(id: string, input: UpdateBodyMeasurementInput): Promise<BodyMeasurement> {
    if (!id) {
      throw new Error('記録IDは必須です');
    }
    return this.repository.update(id, input);
  }
}

export class DeleteBodyMeasurement {
  constructor(private readonly repository: BodyMeasurementRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
