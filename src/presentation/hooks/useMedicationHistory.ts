/**
 * 服薬履歴カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useCallback, useMemo } from 'react';
import { DailyRecordGroup } from '../../domain/entities/MedicationRecord';
import { GetMedicationHistory, DeleteMedicationRecord } from '../../domain/usecases/ManageMedicationRecords';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseMedicationHistoryResult {
  groups: DailyRecordGroup[];
  isLoading: boolean;
  error: Error | null;
  deleteRecord: (recordId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useMedicationHistory = (): UseMedicationHistoryResult => {
  const useCases = useMemo(() => {
    const { medicationRecordRepository } = getDIContainer();
    return {
      getHistory: new GetMedicationHistory(medicationRecordRepository),
      deleteRecord: new DeleteMedicationRecord(medicationRecordRepository),
    };
  }, []);

  const { data: groups, isLoading, error, refetch } = useFetcher(
    () => useCases.getHistory.execute(),
    [useCases],
    [] as DailyRecordGroup[],
  );

  const handleDeleteRecord = useCallback(async (recordId: string) => {
    await useCases.deleteRecord.execute(recordId);
    await refetch();
  }, [useCases, refetch]);

  return {
    groups,
    isLoading,
    error,
    deleteRecord: handleDeleteRecord,
    refetch,
  };
};
