import { Allergy } from '../entities/Allergy';

export interface CreateAllergyInput {
  memberId: string;
  allergenName: string;
  allergyType: string;
  severity: string;
  symptoms?: string;
  diagnosedAt?: string;
  notes?: string;
}

export interface UpdateAllergyInput {
  allergenName?: string;
  allergyType?: string;
  severity?: string;
  symptoms?: string | null;
  diagnosedAt?: string | null;
  notes?: string | null;
}

export interface AllergyRepository {
  findById(id: string): Promise<{ userId: string } | null>;
  getAll(): Promise<Allergy[]>;
  create(input: CreateAllergyInput): Promise<Allergy>;
  update(id: string, input: UpdateAllergyInput): Promise<Allergy>;
  delete(id: string): Promise<void>;
}
