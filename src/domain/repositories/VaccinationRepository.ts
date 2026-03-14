import { Vaccination } from '../entities/Vaccination';

export interface CreateVaccinationInput {
  memberId: string;
  vaccineName: string;
  vaccinatedAt: string;
  nextScheduledDate?: string;
  notes?: string;
}

export interface UpdateVaccinationInput {
  vaccineName?: string;
  vaccinatedAt?: string;
  nextScheduledDate?: string | null;
  notes?: string | null;
}

export interface VaccinationRepository {
  getAll(): Promise<Vaccination[]>;
  create(input: CreateVaccinationInput): Promise<Vaccination>;
  update(id: string, input: UpdateVaccinationInput): Promise<Vaccination>;
  delete(id: string): Promise<void>;
}
