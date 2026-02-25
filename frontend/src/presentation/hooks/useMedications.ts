/**
 * 薬管理カスタムフック（ViewModel）
 */

import { useState, useEffect, useCallback } from 'react';
import { GetMedications, CreateMedication, DeleteMedication, MedicationViewModel } from '../../domain/usecases/ManageMedications';
import { MedicationRepositoryImpl } from '../../data/repositories/MedicationRepositoryImpl';
import { CreateMedicationInput } from '../../domain/repositories/MedicationRepository';

const medicationRepository = new MedicationRepositoryImpl();
const getMedicationsUseCase = new GetMedications(medicationRepository);
const createMedicationUseCase = new CreateMedication(medicationRepository);
const deleteMedicationUseCase = new DeleteMedication(medicationRepository);

export interface UseMedicationsResult {
  medications: MedicationViewModel[];
  isLoading: boolean;
  error: Error | null;
  createMedication: (input: CreateMedicationInput) => Promise<void>;
  deleteMedication: (medicationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMedications = (memberId: string): UseMedicationsResult => {
  const [medications, setMedications] = useState<MedicationViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMedications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getMedicationsUseCase.execute(memberId);
      setMedications(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const handleCreateMedication = async (input: CreateMedicationInput) => {
    await createMedicationUseCase.execute(input);
    await fetchMedications();
  };

  const handleDeleteMedication = async (medicationId: string) => {
    await deleteMedicationUseCase.execute(medicationId);
    await fetchMedications();
  };

  return {
    medications,
    isLoading,
    error,
    createMedication: handleCreateMedication,
    deleteMedication: handleDeleteMedication,
    refetch: fetchMedications,
  };
};
