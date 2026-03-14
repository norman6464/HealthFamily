import { Examination } from '../entities/Examination';
import {
  ExaminationRepository,
  CreateExaminationInput,
  UpdateExaminationInput,
} from '../repositories/ExaminationRepository';

export class GetExaminations {
  constructor(private readonly examinationRepository: ExaminationRepository) {}

  async execute(): Promise<Examination[]> {
    return this.examinationRepository.getAll();
  }
}

export class CreateExamination {
  constructor(private readonly examinationRepository: ExaminationRepository) {}

  async execute(input: CreateExaminationInput): Promise<Examination> {
    if (!input.memberId) {
      throw new Error('メンバーIDは必須です');
    }
    if (!input.examinationType) {
      throw new Error('検査の種類は必須です');
    }
    if (!input.examinedAt) {
      throw new Error('検査日は必須です');
    }
    return this.examinationRepository.create(input);
  }
}

export class UpdateExamination {
  constructor(private readonly examinationRepository: ExaminationRepository) {}

  async execute(id: string, input: UpdateExaminationInput): Promise<Examination> {
    if (!id) {
      throw new Error('検査IDは必須です');
    }
    return this.examinationRepository.update(id, input);
  }
}

export class DeleteExamination {
  constructor(private readonly examinationRepository: ExaminationRepository) {}

  async execute(id: string): Promise<void> {
    return this.examinationRepository.delete(id);
  }
}
