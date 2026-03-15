import { useCallback, useMemo } from 'react';
import { Allergy } from '../../domain/entities/Allergy';
import { GetAllergies, CreateAllergy, UpdateAllergy, DeleteAllergy } from '../../domain/usecases/ManageAllergies';
import { CreateAllergyInput, UpdateAllergyInput } from '../../domain/repositories/AllergyRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseAllergiesResult {
  allergies: Allergy[];
  isLoading: boolean;
  error: Error | null;
  createAllergy: (input: CreateAllergyInput) => Promise<void>;
  updateAllergy: (id: string, input: UpdateAllergyInput) => Promise<void>;
  deleteAllergy: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAllergies = (): UseAllergiesResult => {
  const useCases = useMemo(() => {
    const { allergyRepository } = getDIContainer();
    return {
      getAllergies: new GetAllergies(allergyRepository),
      createAllergy: new CreateAllergy(allergyRepository),
      updateAllergy: new UpdateAllergy(allergyRepository),
      deleteAllergy: new DeleteAllergy(allergyRepository),
    };
  }, []);

  const { data: allergies, isLoading, error, refetch } = useFetcher(
    async () => useCases.getAllergies.execute(),
    [useCases],
    [] as Allergy[],
    'allergies',
  );

  const handleCreate = useCallback(async (input: CreateAllergyInput) => {
    await useCases.createAllergy.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdate = useCallback(async (id: string, input: UpdateAllergyInput) => {
    await useCases.updateAllergy.execute(id, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await useCases.deleteAllergy.execute(id);
    await refetch();
  }, [useCases, refetch]);

  return {
    allergies,
    isLoading,
    error,
    createAllergy: handleCreate,
    updateAllergy: handleUpdate,
    deleteAllergy: handleDelete,
    refetch,
  };
};
