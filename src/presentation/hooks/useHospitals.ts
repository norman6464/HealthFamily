/**
 * 病院管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Hospital } from '../../domain/entities/Appointment';
import { GetHospitals, CreateHospital, UpdateHospital, DeleteHospital } from '../../domain/usecases/ManageHospitals';
import { CreateHospitalInput, UpdateHospitalInput } from '../../domain/repositories/HospitalRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';

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

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHospitals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await useCases.getHospitals.execute();
      setHospitals(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [useCases]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleCreateHospital = async (input: CreateHospitalInput) => {
    await useCases.createHospital.execute(input);
    await fetchHospitals();
  };

  const handleUpdateHospital = async (hospitalId: string, input: UpdateHospitalInput) => {
    await useCases.updateHospital.execute(hospitalId, input);
    await fetchHospitals();
  };

  const handleDeleteHospital = async (hospitalId: string) => {
    await useCases.deleteHospital.execute(hospitalId);
    await fetchHospitals();
  };

  return {
    hospitals,
    isLoading,
    error,
    createHospital: handleCreateHospital,
    updateHospital: handleUpdateHospital,
    deleteHospital: handleDeleteHospital,
    refetch: fetchHospitals,
  };
};
