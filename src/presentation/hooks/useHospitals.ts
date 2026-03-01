/**
 * 病院管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useCallback, useMemo } from 'react';
import { Hospital } from '../../domain/entities/Hospital';
import { GetHospitals, CreateHospital, UpdateHospital, DeleteHospital } from '../../domain/usecases/ManageHospitals';
import { CreateHospitalInput, UpdateHospitalInput } from '../../domain/repositories/HospitalRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseHospitalsResult {
  hospitals: Hospital[];
  isLoading: boolean;
  error: Error | null;
  createHospital: (input: CreateHospitalInput) => Promise<void>;
  updateHospital: (hospitalId: string, input: UpdateHospitalInput) => Promise<void>;
  deleteHospital: (hospitalId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useHospitals = (): UseHospitalsResult => {
  const useCases = useMemo(() => {
    const { hospitalRepository } = getDIContainer();
    return {
      getHospitals: new GetHospitals(hospitalRepository),
      createHospital: new CreateHospital(hospitalRepository),
      updateHospital: new UpdateHospital(hospitalRepository),
      deleteHospital: new DeleteHospital(hospitalRepository),
    };
  }, []);

  const { data: hospitals, isLoading, error, refetch } = useFetcher(
    () => useCases.getHospitals.execute(),
    [useCases],
    [] as Hospital[],
  );

  const handleCreateHospital = useCallback(async (input: CreateHospitalInput) => {
    await useCases.createHospital.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdateHospital = useCallback(async (hospitalId: string, input: UpdateHospitalInput) => {
    await useCases.updateHospital.execute(hospitalId, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDeleteHospital = useCallback(async (hospitalId: string) => {
    await useCases.deleteHospital.execute(hospitalId);
    await refetch();
  }, [useCases, refetch]);

  return {
    hospitals,
    isLoading,
    error,
    createHospital: handleCreateHospital,
    updateHospital: handleUpdateHospital,
    deleteHospital: handleDeleteHospital,
    refetch,
  };
};
