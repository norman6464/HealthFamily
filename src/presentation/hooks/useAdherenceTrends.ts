/**
 * 服薬トレンド取得フック
 */

import { useMemo } from 'react';
import { AdherenceTrend } from '../../domain/entities/AdherenceTrend';
import { GetAdherenceTrends } from '../../domain/usecases/ManageMedicationRecords';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseAdherenceTrendsResult {
  trend: AdherenceTrend | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const defaultTrend: AdherenceTrend | null = null;

export const useAdherenceTrends = (): UseAdherenceTrendsResult => {
  const useCase = useMemo(() => {
    const { medicationRecordRepository } = getDIContainer();
    return new GetAdherenceTrends(medicationRecordRepository);
  }, []);

  const { data, isLoading, error, refetch } = useFetcher(
    () => useCase.execute(),
    [useCase],
    defaultTrend,
  );

  return { trend: data, isLoading, error, refetch };
};
