import { useCallback, useMemo } from 'react';
import { Vaccination } from '../../domain/entities/Vaccination';
import { GetVaccinations, CreateVaccination, UpdateVaccination, DeleteVaccination } from '../../domain/usecases/ManageVaccinations';
import { CreateVaccinationInput, UpdateVaccinationInput } from '../../domain/repositories/VaccinationRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseVaccinationsResult {
  vaccinations: Vaccination[];
  isLoading: boolean;
  error: Error | null;
  createVaccination: (input: CreateVaccinationInput) => Promise<void>;
  updateVaccination: (id: string, input: UpdateVaccinationInput) => Promise<void>;
  deleteVaccination: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useVaccinations = (): UseVaccinationsResult => {
  const useCases = useMemo(() => {
    const { vaccinationRepository } = getDIContainer();
    return {
      getVaccinations: new GetVaccinations(vaccinationRepository),
      createVaccination: new CreateVaccination(vaccinationRepository),
      updateVaccination: new UpdateVaccination(vaccinationRepository),
      deleteVaccination: new DeleteVaccination(vaccinationRepository),
    };
  }, []);

  const { data: vaccinations, isLoading, error, refetch } = useFetcher(
    async () => useCases.getVaccinations.execute(),
    [useCases],
    [] as Vaccination[],
    'vaccinations',
  );

  const handleCreate = useCallback(async (input: CreateVaccinationInput) => {
    await useCases.createVaccination.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdate = useCallback(async (id: string, input: UpdateVaccinationInput) => {
    await useCases.updateVaccination.execute(id, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await useCases.deleteVaccination.execute(id);
    await refetch();
  }, [useCases, refetch]);

  return {
    vaccinations,
    isLoading,
    error,
    createVaccination: handleCreate,
    updateVaccination: handleUpdate,
    deleteVaccination: handleDelete,
    refetch,
  };
};
