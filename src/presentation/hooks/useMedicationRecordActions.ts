/**
 * 服薬記録アクションフック
 * 服薬完了記録の作成をPresentation層経由で提供
 */

import { useCallback, useMemo, useState } from 'react';
import { CreateMedicationRecord } from '../../domain/usecases/ManageMedicationRecords';
import { getDIContainer } from '../../infrastructure/DIContainer';

export interface UseMedicationRecordActionsResult {
  markAsTaken: (memberId: string, medicationId: string, notes?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useMedicationRecordActions = (): UseMedicationRecordActionsResult => {
  const useCase = useMemo(() => {
    const { medicationRecordRepository } = getDIContainer();
    return new CreateMedicationRecord(medicationRecordRepository);
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markAsTaken = useCallback(async (memberId: string, medicationId: string, notes?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await useCase.execute({ memberId, medicationId, notes });
    } catch (err) {
      const e = err instanceof Error ? err : new Error('記録に失敗しました');
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [useCase]);

  return { markAsTaken, isLoading, error };
};
