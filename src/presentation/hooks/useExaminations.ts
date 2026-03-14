import { useCallback, useMemo } from 'react';
import { Examination } from '../../domain/entities/Examination';
import { GetExaminations, CreateExamination, UpdateExamination, DeleteExamination } from '../../domain/usecases/ManageExaminations';
import { CreateExaminationInput, UpdateExaminationInput } from '../../domain/repositories/ExaminationRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseExaminationsResult {
  examinations: Examination[];
  isLoading: boolean;
  error: Error | null;
  createExamination: (input: CreateExaminationInput) => Promise<void>;
  updateExamination: (id: string, input: UpdateExaminationInput) => Promise<void>;
  deleteExamination: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useExaminations = (): UseExaminationsResult => {
  const useCases = useMemo(() => {
    const { examinationRepository } = getDIContainer();
    return {
      getExaminations: new GetExaminations(examinationRepository),
      createExamination: new CreateExamination(examinationRepository),
      updateExamination: new UpdateExamination(examinationRepository),
      deleteExamination: new DeleteExamination(examinationRepository),
    };
  }, []);

  const { data: examinations, isLoading, error, refetch } = useFetcher(
    async () => useCases.getExaminations.execute(),
    [useCases],
    [] as Examination[],
    'examinations',
  );

  const handleCreate = useCallback(async (input: CreateExaminationInput) => {
    await useCases.createExamination.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdate = useCallback(async (id: string, input: UpdateExaminationInput) => {
    await useCases.updateExamination.execute(id, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await useCases.deleteExamination.execute(id);
    await refetch();
  }, [useCases, refetch]);

  return {
    examinations,
    isLoading,
    error,
    createExamination: handleCreate,
    updateExamination: handleUpdate,
    deleteExamination: handleDelete,
    refetch,
  };
};
