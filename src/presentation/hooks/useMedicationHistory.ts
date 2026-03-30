/**
 * 服薬履歴カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useCallback, useMemo } from 'react';
import { DailyRecordGroup } from '../../domain/entities/MedicationRecord';
import { GetMedicationHistory, DeleteMedicationRecord, CreateMedicationRecord, UpdateMedicationRecord } from '../../domain/usecases/ManageMedicationRecords';
import { CreateRecordInput, UpdateRecordInput } from '../../domain/repositories/MedicationRecordRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseMedicationHistoryResult {
  groups: DailyRecordGroup[];
  isLoading: boolean;
  error: Error | null;
  deleteRecord: (recordId: string) => Promise<void>;
  updateRecord: (recordId: string, input: UpdateRecordInput) => Promise<void>;
  createRecord: (input: CreateRecordInput) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMedicationHistory = (): UseMedicationHistoryResult => {
  const useCases = useMemo(() => {
    const { medicationRecordRepository } = getDIContainer();
    return {
      getHistory: new GetMedicationHistory(medicationRecordRepository),
      deleteRecord: new DeleteMedicationRecord(medicationRecordRepository),
      updateRecord: new UpdateMedicationRecord(medicationRecordRepository),
      createRecord: new CreateMedicationRecord(medicationRecordRepository),
    };
  }, []);

  const { data: groups, isLoading, error, refetch } = useFetcher(
    () => useCases.getHistory.execute(),
    [useCases],
    [] as DailyRecordGroup[],
    'medication-history',
  );

  const handleDeleteRecord = useCallback(async (recordId: string) => {
    await useCases.deleteRecord.execute(recordId);
    await refetch();
  }, [useCases, refetch]);

  const handleUpdateRecord = useCallback(async (recordId: string, input: UpdateRecordInput) => {
    await useCases.updateRecord.execute(recordId, input);
    await refetch();
  }, [useCases, refetch]);

  const handleCreateRecord = useCallback(async (input: CreateRecordInput) => {
    await useCases.createRecord.execute(input);
    await refetch();
  }, [useCases, refetch]);

  return {
    groups,
    isLoading,
    error,
    deleteRecord: handleDeleteRecord,
    updateRecord: handleUpdateRecord,
    createRecord: handleCreateRecord,
    refetch,
  };
};
