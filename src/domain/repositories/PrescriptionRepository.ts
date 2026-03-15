import { Prescription } from '../entities/Prescription';

export interface CreatePrescriptionInput {
  memberId: string;
  prescriptionName: string;
  prescribedBy?: string;
  prescribedAt: string;
  expiresAt?: string;
  pharmacyName?: string;
  notes?: string;
}

export interface UpdatePrescriptionInput {
  prescriptionName?: string;
  prescribedBy?: string | null;
  prescribedAt?: string;
  expiresAt?: string | null;
  pharmacyName?: string | null;
  notes?: string | null;
}

export interface PrescriptionRepository {
  getAll(): Promise<Prescription[]>;
  create(input: CreatePrescriptionInput): Promise<Prescription>;
  update(id: string, input: UpdatePrescriptionInput): Promise<Prescription>;
  delete(id: string): Promise<void>;
}
