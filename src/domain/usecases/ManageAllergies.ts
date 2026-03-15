import { Allergy } from '../entities/Allergy';
import {
  AllergyRepository,
  CreateAllergyInput,
  UpdateAllergyInput,
} from '../repositories/AllergyRepository';

export class GetAllergies {
  constructor(private readonly allergyRepository: AllergyRepository) {}

  async execute(): Promise<Allergy[]> {
    return this.allergyRepository.getAll();
  }
}

export class CreateAllergy {
  constructor(private readonly allergyRepository: AllergyRepository) {}

  async execute(input: CreateAllergyInput): Promise<Allergy> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.allergenName) {
      throw new Error('アレルゲン名は必須です');
    }
    if (!input.allergyType) {
      throw new Error('アレルギーの種類は必須です');
    }
    if (!input.severity) {
      throw new Error('重症度は必須です');
    }
    return this.allergyRepository.create(input);
  }
}

export class UpdateAllergy {
  constructor(private readonly allergyRepository: AllergyRepository) {}

  async execute(id: string, input: UpdateAllergyInput): Promise<Allergy> {
    if (!id) {
      throw new Error('アレルギーIDは必須です');
    }
    return this.allergyRepository.update(id, input);
  }
}

export class DeleteAllergy {
  constructor(private readonly allergyRepository: AllergyRepository) {}

  async execute(id: string): Promise<void> {
    return this.allergyRepository.delete(id);
  }
}
