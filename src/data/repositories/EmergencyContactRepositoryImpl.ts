import {
  EmergencyContactRepository,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from '../../domain/repositories/EmergencyContactRepository';
import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { emergencyContactApi } from '../api/emergencyContactApi';

export class EmergencyContactRepositoryImpl implements EmergencyContactRepository {
  async findById(_id: string): Promise<{ userId: string } | null> {
    throw new Error('findById はサーバーサイド専用です');
  }

  async getAll(): Promise<EmergencyContact[]> {
    return emergencyContactApi.getEmergencyContacts();
  }

  async create(input: CreateEmergencyContactInput): Promise<EmergencyContact> {
    return emergencyContactApi.createEmergencyContact(input);
  }

  async update(id: string, input: UpdateEmergencyContactInput): Promise<EmergencyContact> {
    return emergencyContactApi.updateEmergencyContact(id, input);
  }

  async delete(id: string): Promise<void> {
    return emergencyContactApi.deleteEmergencyContact(id);
  }
}
