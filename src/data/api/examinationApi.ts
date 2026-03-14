import { Examination } from '../../domain/entities/Examination';
import { CreateExaminationInput, UpdateExaminationInput } from '../../domain/repositories/ExaminationRepository';
import { apiClient } from './apiClient';
import { toExamination } from './mappers';
import { BackendExamination } from './types';

export const examinationApi = {
  async getExaminations(): Promise<Examination[]> {
    const data = await apiClient.get<BackendExamination[]>('/examinations');
    return data.map(toExamination);
  },

  async createExamination(input: CreateExaminationInput): Promise<Examination> {
    const data = await apiClient.post<BackendExamination>('/examinations', input);
    return toExamination(data);
  },

  async updateExamination(id: string, input: UpdateExaminationInput): Promise<Examination> {
    const data = await apiClient.put<BackendExamination>(`/examinations/${id}`, input);
    return toExamination(data);
  },

  async deleteExamination(id: string): Promise<void> {
    await apiClient.del(`/examinations/${id}`);
  },
};
