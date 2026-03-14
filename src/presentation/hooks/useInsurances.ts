import { useCallback, useMemo } from 'react';
import { Insurance } from '../../domain/entities/Insurance';
import { GetInsurances, CreateInsurance, UpdateInsurance, DeleteInsurance } from '../../domain/usecases/ManageInsurances';
import { CreateInsuranceInput, UpdateInsuranceInput } from '../../domain/repositories/InsuranceRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseInsurancesResult {
  insurances: Insurance[];
  isLoading: boolean;
  error: Error | null;
  createInsurance: (input: CreateInsuranceInput) => Promise<void>;
  updateInsurance: (id: string, input: UpdateInsuranceInput) => Promise<void>;
  deleteInsurance: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useInsurances = (): UseInsurancesResult => {
  const useCases = useMemo(() => {
    const { insuranceRepository } = getDIContainer();
    return {
      getInsurances: new GetInsurances(insuranceRepository),
      createInsurance: new CreateInsurance(insuranceRepository),
      updateInsurance: new UpdateInsurance(insuranceRepository),
      deleteInsurance: new DeleteInsurance(insuranceRepository),
    };
  }, []);

  const { data: insurances, isLoading, error, refetch } = useFetcher(
    async () => useCases.getInsurances.execute(),
    [useCases],
    [] as Insurance[],
    'insurances',
  );

  const handleCreate = useCallback(async (input: CreateInsuranceInput) => {
    await useCases.createInsurance.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdate = useCallback(async (id: string, input: UpdateInsuranceInput) => {
    await useCases.updateInsurance.execute(id, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await useCases.deleteInsurance.execute(id);
    await refetch();
  }, [useCases, refetch]);

  return {
    insurances,
    isLoading,
    error,
    createInsurance: handleCreate,
    updateInsurance: handleUpdate,
    deleteInsurance: handleDelete,
    refetch,
  };
};
