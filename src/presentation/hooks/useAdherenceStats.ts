/**
 * 服薬アドヒアランス統計取得フック
 */

import { useMemo } from 'react';
import { AdherenceStats } from '../../domain/entities/AdherenceStats';
import { GetAdherenceStats } from '../../domain/usecases/ManageMedicationRecords';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseAdherenceStatsResult {
  stats: AdherenceStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const defaultStats: AdherenceStats = {
  overall: { weeklyRate: 0, monthlyRate: 0, weeklyCount: 0, monthlyCount: 0 },
  members: [],
};

export const useAdherenceStats = (): UseAdherenceStatsResult => {
  const useCase = useMemo(() => {
    const { medicationRecordRepository } = getDIContainer();
    return new GetAdherenceStats(medicationRecordRepository);
  }, []);

  const { data, isLoading, error, refetch } = useFetcher(
    () => useCase.execute(),
    [useCase],
    defaultStats,
  );

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
};
