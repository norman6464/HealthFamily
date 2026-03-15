import { useCallback, useMemo } from 'react';
import { Prescription } from '../../domain/entities/Prescription';
import { GetPrescriptions, CreatePrescription, UpdatePrescription, DeletePrescription } from '../../domain/usecases/ManagePrescriptions';
import { CreatePrescriptionInput, UpdatePrescriptionInput } from '../../domain/repositories/PrescriptionRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UsePrescriptionsResult {
  prescriptions: Prescription[];
  isLoading: boolean;
  error: Error | null;
  createPrescription: (input: CreatePrescriptionInput) => Promise<void>;
  updatePrescription: (id: string, input: UpdatePrescriptionInput) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const usePrescriptions = (): UsePrescriptionsResult => {
  const useCases = useMemo(() => {
    const { prescriptionRepository } = getDIContainer();
    return {
      getPrescriptions: new GetPrescriptions(prescriptionRepository),
      createPrescription: new CreatePrescription(prescriptionRepository),
      updatePrescription: new UpdatePrescription(prescriptionRepository),
      deletePrescription: new DeletePrescription(prescriptionRepository),
    };
  }, []);

  const { data: prescriptions, isLoading, error, refetch } = useFetcher(
    async () => useCases.getPrescriptions.execute(),
    [useCases],
    [] as Prescription[],
    'prescriptions',
  );

  const handleCreate = useCallback(async (input: CreatePrescriptionInput) => {
    await useCases.createPrescription.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdate = useCallback(async (id: string, input: UpdatePrescriptionInput) => {
    await useCases.updatePrescription.execute(id, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await useCases.deletePrescription.execute(id);
    await refetch();
  }, [useCases, refetch]);

  return {
    prescriptions,
    isLoading,
    error,
    createPrescription: handleCreate,
    updatePrescription: handleUpdate,
    deletePrescription: handleDelete,
    refetch,
  };
};
