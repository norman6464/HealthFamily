/**
 * 服薬記録アクションフック
 * 服薬完了記録の作成をPresentation層経由で提供
 */

import { useCallback, useMemo } from 'react';
import { CreateMedicationRecord } from '../../domain/usecases/ManageMedicationRecords';
import { getDIContainer } from '../../infrastructure/DIContainer';

export const useMedicationRecordActions = () => {
  const useCase = useMemo(() => {
    const { medicationRecordRepository } = getDIContainer();
    return new CreateMedicationRecord(medicationRecordRepository);
  }, []);

  const markAsTaken = useCallback(async (memberId: string, medicationId: string) => {
    await useCase.execute({ memberId, medicationId });
  }, [useCase]);

  return { markAsTaken };
};
