import {
  VaccinationRepository,
  CreateVaccinationInput,
  UpdateVaccinationInput,
} from '../../domain/repositories/VaccinationRepository';
import { Vaccination } from '../../domain/entities/Vaccination';
import { vaccinationApi } from '../api/vaccinationApi';

export class VaccinationRepositoryImpl implements VaccinationRepository {
  async getAll(): Promise<Vaccination[]> {
    return vaccinationApi.getVaccinations();
  }

  async create(input: CreateVaccinationInput): Promise<Vaccination> {
    return vaccinationApi.createVaccination(input);
  }

  async update(id: string, input: UpdateVaccinationInput): Promise<Vaccination> {
    return vaccinationApi.updateVaccination(id, input);
  }

  async delete(id: string): Promise<void> {
    return vaccinationApi.deleteVaccination(id);
  }
}
