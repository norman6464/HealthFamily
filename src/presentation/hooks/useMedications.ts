/**
 * 薬管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GetMedications, CreateMedication, UpdateMedication, DeleteMedication, MedicationViewModel } from '../../domain/usecases/ManageMedications';
import { CreateMedicationInput, UpdateMedicationInput } from '../../domain/repositories/MedicationRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';

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

  const [medications, setMedications] = useState<MedicationViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMedications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await useCases.getMedications.execute(memberId);
      setMedications(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [memberId, useCases]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const handleCreateMedication = async (input: CreateMedicationInput) => {
    await useCases.createMedication.execute(input);
    await fetchMedications();
  };

  const handleUpdateMedication = async (medicationId: string, input: UpdateMedicationInput) => {
    await useCases.updateMedication.execute(medicationId, input);
    await fetchMedications();
  };

  const handleDeleteMedication = async (medicationId: string) => {
    await useCases.deleteMedication.execute(medicationId);
    await fetchMedications();
  };

  return {
    medications,
    isLoading,
    error,
    createMedication: handleCreateMedication,
    updateMedication: handleUpdateMedication,
    deleteMedication: handleDeleteMedication,
    refetch: fetchMedications,
  };
};
