/**
 * 服薬履歴カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DailyRecordGroup } from '../../domain/entities/MedicationRecord';
import { GetMedicationHistory, DeleteMedicationRecord } from '../../domain/usecases/ManageMedicationRecords';
import { getDIContainer } from '../../infrastructure/DIContainer';

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

  const [groups, setGroups] = useState<DailyRecordGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await useCases.getHistory.execute();
      setGroups(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [useCases]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteRecord = async (recordId: string) => {
    await useCases.deleteRecord.execute(recordId);
    await fetchHistory();
  };

  return {
    groups,
    isLoading,
    error,
    deleteRecord: handleDeleteRecord,
    refetch: fetchHistory,
  };
};
