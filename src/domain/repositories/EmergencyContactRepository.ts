import { EmergencyContact } from '../entities/EmergencyContact';

export interface CreateEmergencyContactInput {
  memberId: string;
  contactName: string;
  phoneNumber: string;
  relationship?: string;
  notes?: string;
}

export interface UpdateEmergencyContactInput {
  contactName?: string;
  phoneNumber?: string;
  relationship?: string | null;
  notes?: string | null;
}

export interface EmergencyContactRepository {
  getAll(): Promise<EmergencyContact[]>;
  create(input: CreateEmergencyContactInput): Promise<EmergencyContact>;
  update(id: string, input: UpdateEmergencyContactInput): Promise<EmergencyContact>;
  delete(id: string): Promise<void>;
}
