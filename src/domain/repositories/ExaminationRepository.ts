import { Examination } from '../entities/Examination';

export interface CreateExaminationInput {
  memberId: string;
  examinationType: string;
  examinedAt: string;
  nextScheduledDate?: string;
  notes?: string;
}

export interface UpdateExaminationInput {
  examinationType?: string;
  examinedAt?: string;
  nextScheduledDate?: string | null;
  notes?: string | null;
}

export interface ExaminationRepository {
  findById(id: string): Promise<{ userId: string } | null>;
  getAll(): Promise<Examination[]>;
  create(input: CreateExaminationInput): Promise<Examination>;
  update(id: string, input: UpdateExaminationInput): Promise<Examination>;
  delete(id: string): Promise<void>;
}
