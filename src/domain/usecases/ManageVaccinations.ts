import { Vaccination } from '../entities/Vaccination';
import {
  VaccinationRepository,
  CreateVaccinationInput,
  UpdateVaccinationInput,
} from '../repositories/VaccinationRepository';

export class GetVaccinations {
  constructor(private readonly vaccinationRepository: VaccinationRepository) {}

  async execute(): Promise<Vaccination[]> {
    return this.vaccinationRepository.getAll();
  }
}

export class CreateVaccination {
  constructor(private readonly vaccinationRepository: VaccinationRepository) {}

  async execute(input: CreateVaccinationInput): Promise<Vaccination> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.vaccineName) {
      throw new Error('ワクチンの種類は必須です');
    }
    if (!input.vaccinatedAt) {
      throw new Error('接種日は必須です');
    }
    return this.vaccinationRepository.create(input);
  }
}

export class UpdateVaccination {
  constructor(private readonly vaccinationRepository: VaccinationRepository) {}

  async execute(id: string, input: UpdateVaccinationInput): Promise<Vaccination> {
    if (!id) {
      throw new Error('ワクチンIDは必須です');
    }
    return this.vaccinationRepository.update(id, input);
  }
}

export class DeleteVaccination {
  constructor(private readonly vaccinationRepository: VaccinationRepository) {}

  async execute(id: string): Promise<void> {
    return this.vaccinationRepository.delete(id);
  }
}
