/**
 * 薬管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useCallback, useMemo } from 'react';
import { GetMedications, CreateMedication, UpdateMedication, DeleteMedication, MedicationViewModel } from '../../domain/usecases/ManageMedications';
import { CreateMedicationInput, UpdateMedicationInput } from '../../domain/repositories/MedicationRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseMedicationsResult {
  medications: MedicationViewModel[];
  isLoading: boolean;
  error: Error | null;
  createMedication: (input: CreateMedicationInput) => Promise<void>;
  updateMedication: (medicationId: string, input: UpdateMedicationInput) => Promise<void>;
  deleteMedication: (medicationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMedications = (memberId: string): UseMedicationsResult => {
  const useCases = useMemo(() => {
    const { medicationRepository } = getDIContainer();
    return {
      getMedications: new GetMedications(medicationRepository),
      createMedication: new CreateMedication(medicationRepository),
      updateMedication: new UpdateMedication(medicationRepository),
      deleteMedication: new DeleteMedication(medicationRepository),
    };
  }, []);

  const { data: medications, isLoading, error, refetch } = useFetcher(
    () => useCases.getMedications.execute(memberId),
    [memberId, useCases],
    [] as MedicationViewModel[],
  );

  const handleCreateMedication = useCallback(async (input: CreateMedicationInput) => {
    await useCases.createMedication.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdateMedication = useCallback(async (medicationId: string, input: UpdateMedicationInput) => {
    await useCases.updateMedication.execute(medicationId, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDeleteMedication = useCallback(async (medicationId: string) => {
    await useCases.deleteMedication.execute(medicationId);
    await refetch();
  }, [useCases, refetch]);

  return {
    medications,
    isLoading,
    error,
    createMedication: handleCreateMedication,
    updateMedication: handleUpdateMedication,
    deleteMedication: handleDeleteMedication,
    refetch,
  };
};
