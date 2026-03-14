import {
  ExaminationRepository,
  CreateExaminationInput,
  UpdateExaminationInput,
} from '../../domain/repositories/ExaminationRepository';
import { Examination } from '../../domain/entities/Examination';
import { examinationApi } from '../api/examinationApi';

export class ExaminationRepositoryImpl implements ExaminationRepository {
  async getAll(): Promise<Examination[]> {
    return examinationApi.getExaminations();
  }

  async create(input: CreateExaminationInput): Promise<Examination> {
    return examinationApi.createExamination(input);
  }

  async update(id: string, input: UpdateExaminationInput): Promise<Examination> {
    return examinationApi.updateExamination(id, input);
  }

  async delete(id: string): Promise<void> {
    return examinationApi.deleteExamination(id);
  }
}
