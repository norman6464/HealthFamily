import { useCallback, useMemo } from 'react';
import { TemperatureRecord } from '../../domain/entities/TemperatureRecord';
import {
  GetTemperatureRecords,
  CreateTemperatureRecord,
  UpdateTemperatureRecord,
  DeleteTemperatureRecord,
} from '../../domain/usecases/ManageTemperatureRecords';
import {
  CreateTemperatureRecordInput,
  UpdateTemperatureRecordInput,
} from '../../domain/repositories/TemperatureRecordRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseTemperatureRecordsResult {
  records: TemperatureRecord[];
  isLoading: boolean;
  error: Error | null;
  createRecord: (input: CreateTemperatureRecordInput) => Promise<void>;
  updateRecord: (id: string, input: UpdateTemperatureRecordInput) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useTemperatureRecords = (): UseTemperatureRecordsResult => {
  const useCases = useMemo(() => {
    const { temperatureRecordRepository } = getDIContainer();
    return {
      get: new GetTemperatureRecords(temperatureRecordRepository),
      create: new CreateTemperatureRecord(temperatureRecordRepository),
      update: new UpdateTemperatureRecord(temperatureRecordRepository),
      delete: new DeleteTemperatureRecord(temperatureRecordRepository),
    };
  }, []);

  const { data: records, isLoading, error, refetch } = useFetcher(
    () => useCases.get.execute(),
    [useCases],
    [] as TemperatureRecord[],
    'temperature-records',
  );

  const handleCreate = useCallback(async (input: CreateTemperatureRecordInput) => {
    await useCases.create.execute(input);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdate = useCallback(async (id: string, input: UpdateTemperatureRecordInput) => {
    await useCases.update.execute(id, input);
    await refetch();
  }, [useCases, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await useCases.delete.execute(id);
    await refetch();
  }, [useCases, refetch]);

  return {
    records,
    isLoading,
    error,
    createRecord: handleCreate,
    updateRecord: handleUpdate,
    deleteRecord: handleDelete,
    refetch,
  };
};
