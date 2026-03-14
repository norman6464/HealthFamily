import { Insurance } from '../entities/Insurance';

export interface CreateInsuranceInput {
  memberId: string;
  insuranceType: string;
  providerName?: string;
  policyNumber?: string;
  notes?: string;
}

export interface UpdateInsuranceInput {
  insuranceType?: string;
  providerName?: string | null;
  policyNumber?: string | null;
  notes?: string | null;
}

export interface InsuranceRepository {
  getAll(): Promise<Insurance[]>;
  create(input: CreateInsuranceInput): Promise<Insurance>;
  update(id: string, input: UpdateInsuranceInput): Promise<Insurance>;
  delete(id: string): Promise<void>;
}
