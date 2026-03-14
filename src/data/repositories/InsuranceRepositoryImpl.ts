import {
  InsuranceRepository,
  CreateInsuranceInput,
  UpdateInsuranceInput,
} from '../../domain/repositories/InsuranceRepository';
import { Insurance } from '../../domain/entities/Insurance';
import { insuranceApi } from '../api/insuranceApi';

export class InsuranceRepositoryImpl implements InsuranceRepository {
  async getAll(): Promise<Insurance[]> {
    return insuranceApi.getInsurances();
  }

  async create(input: CreateInsuranceInput): Promise<Insurance> {
    return insuranceApi.createInsurance(input);
  }

  async update(id: string, input: UpdateInsuranceInput): Promise<Insurance> {
    return insuranceApi.updateInsurance(id, input);
  }

  async delete(id: string): Promise<void> {
    return insuranceApi.deleteInsurance(id);
  }
}
