import {
  PrescriptionRepository,
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
} from '../../domain/repositories/PrescriptionRepository';
import { Prescription } from '../../domain/entities/Prescription';
import { prescriptionApi } from '../api/prescriptionApi';

export class PrescriptionRepositoryImpl implements PrescriptionRepository {
  async findById(_id: string): Promise<{ userId: string } | null> {
    throw new Error('findById はサーバーサイド専用です');
  }

  async getAll(): Promise<Prescription[]> {
    return prescriptionApi.getPrescriptions();
  }

  async create(input: CreatePrescriptionInput): Promise<Prescription> {
    return prescriptionApi.createPrescription(input);
  }

  async update(id: string, input: UpdatePrescriptionInput): Promise<Prescription> {
    return prescriptionApi.updatePrescription(id, input);
  }

  async delete(id: string): Promise<void> {
    return prescriptionApi.deletePrescription(id);
  }
}
