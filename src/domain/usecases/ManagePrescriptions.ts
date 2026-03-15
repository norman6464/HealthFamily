import { Prescription } from '../entities/Prescription';
import {
  PrescriptionRepository,
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
} from '../repositories/PrescriptionRepository';

export class GetPrescriptions {
  constructor(private readonly repository: PrescriptionRepository) {}

  async execute(): Promise<Prescription[]> {
    return this.repository.getAll();
  }
}

export class CreatePrescription {
  constructor(private readonly repository: PrescriptionRepository) {}

  async execute(input: CreatePrescriptionInput): Promise<Prescription> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.prescriptionName) {
      throw new Error('処方箋名は必須です');
    }
    if (!input.prescribedAt) {
      throw new Error('処方日は必須です');
    }
    return this.repository.create(input);
  }
}

export class UpdatePrescription {
  constructor(private readonly repository: PrescriptionRepository) {}

  async execute(id: string, input: UpdatePrescriptionInput): Promise<Prescription> {
    if (!id) {
      throw new Error('処方箋IDは必須です');
    }
    return this.repository.update(id, input);
  }
}

export class DeletePrescription {
  constructor(private readonly repository: PrescriptionRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
