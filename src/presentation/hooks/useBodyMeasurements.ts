import { useCallback, useMemo } from 'react';
import { BodyMeasurement } from '../../domain/entities/BodyMeasurement';
import { GetBodyMeasurements, CreateBodyMeasurement, UpdateBodyMeasurement, DeleteBodyMeasurement } from '../../domain/usecases/ManageBodyMeasurements';
import { CreateBodyMeasurementInput, UpdateBodyMeasurementInput } from '../../domain/repositories/BodyMeasurementRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseBodyMeasurementsResult {
  measurements: BodyMeasurement[];
  isLoading: boolean;
  error: Error | null;
  createMeasurement: (input: CreateBodyMeasurementInput) => Promise<void>;
  updateMeasurement: (id: string, input: UpdateBodyMeasurementInput) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useBodyMeasurements = (): UseBodyMeasurementsResult => {
  const useCases = useMemo(() => {
    const { bodyMeasurementRepository } = getDIContainer();
    return {
      getMeasurements: new GetBodyMeasurements(bodyMeasurementRepository),
      createMeasurement: new CreateBodyMeasurement(bodyMeasurementRepository),
      updateMeasurement: new UpdateBodyMeasurement(bodyMeasurementRepository),
      deleteMeasurement: new DeleteBodyMeasurement(bodyMeasurementRepository),
    };
  }, []);

  const { data: measurements, isLoading, error, refetch } = useFetcher(
    async () => useCases.getMeasurements.execute(),
    [useCases],
    [] as BodyMeasurement[],
    'bodyMeasurements',
  );

  const handleCreate = useCallback(async (input: CreateBodyMeasurementInput) => {
    await useCases.createMeasurement.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdate = useCallback(async (id: string, input: UpdateBodyMeasurementInput) => {
    await useCases.updateMeasurement.execute(id, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await useCases.deleteMeasurement.execute(id);
    await refetch();
  }, [useCases, refetch]);

  return {
    measurements,
    isLoading,
    error,
    createMeasurement: handleCreate,
    updateMeasurement: handleUpdate,
    deleteMeasurement: handleDelete,
    refetch,
  };
};
