import { EmergencyContact } from '../entities/EmergencyContact';
import {
  EmergencyContactRepository,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from '../repositories/EmergencyContactRepository';

export class GetEmergencyContacts {
  constructor(private readonly repository: EmergencyContactRepository) {}

  async execute(): Promise<EmergencyContact[]> {
    return this.repository.getAll();
  }
}

export class CreateEmergencyContact {
  constructor(private readonly repository: EmergencyContactRepository) {}

  async execute(input: CreateEmergencyContactInput): Promise<EmergencyContact> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.contactName) {
      throw new Error('連絡先名は必須です');
    }
    if (!input.phoneNumber) {
      throw new Error('電話番号は必須です');
    }
    return this.repository.create(input);
  }
}

export class UpdateEmergencyContact {
  constructor(private readonly repository: EmergencyContactRepository) {}

  async execute(id: string, input: UpdateEmergencyContactInput): Promise<EmergencyContact> {
    if (!id) {
      throw new Error('連絡先IDは必須です');
    }
    return this.repository.update(id, input);
  }
}

export class DeleteEmergencyContact {
  constructor(private readonly repository: EmergencyContactRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
