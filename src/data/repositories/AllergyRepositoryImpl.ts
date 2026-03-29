import {
  AllergyRepository,
  CreateAllergyInput,
  UpdateAllergyInput,
} from '../../domain/repositories/AllergyRepository';
import { Allergy } from '../../domain/entities/Allergy';
import { allergyApi } from '../api/allergyApi';

export class AllergyRepositoryImpl implements AllergyRepository {
  async findById(_id: string): Promise<{ userId: string } | null> {
    throw new Error('findById はサーバーサイド専用です');
  }

  async getAll(): Promise<Allergy[]> {
    return allergyApi.getAllergies();
  }

  async create(input: CreateAllergyInput): Promise<Allergy> {
    return allergyApi.createAllergy(input);
  }

  async update(id: string, input: UpdateAllergyInput): Promise<Allergy> {
    return allergyApi.updateAllergy(id, input);
  }

  async delete(id: string): Promise<void> {
    return allergyApi.deleteAllergy(id);
  }
}
