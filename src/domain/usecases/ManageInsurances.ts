import { Insurance } from '../entities/Insurance';
import {
  InsuranceRepository,
  CreateInsuranceInput,
  UpdateInsuranceInput,
} from '../repositories/InsuranceRepository';

export class GetInsurances {
  constructor(private readonly insuranceRepository: InsuranceRepository) {}

  async execute(): Promise<Insurance[]> {
    return this.insuranceRepository.getAll();
  }
}

export class CreateInsurance {
  constructor(private readonly insuranceRepository: InsuranceRepository) {}

  async execute(input: CreateInsuranceInput): Promise<Insurance> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.insuranceType) {
      throw new Error('保険の種類は必須です');
    }
    return this.insuranceRepository.create(input);
  }
}

export class UpdateInsurance {
  constructor(private readonly insuranceRepository: InsuranceRepository) {}

  async execute(id: string, input: UpdateInsuranceInput): Promise<Insurance> {
    if (!id) {
      throw new Error('保険IDは必須です');
    }
    return this.insuranceRepository.update(id, input);
  }
}

export class DeleteInsurance {
  constructor(private readonly insuranceRepository: InsuranceRepository) {}

  async execute(id: string): Promise<void> {
    return this.insuranceRepository.delete(id);
  }
}
