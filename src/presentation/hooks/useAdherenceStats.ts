/**
 * 服薬アドヒアランス統計取得フック
 */

import { AdherenceStats } from '../../domain/entities/AdherenceStats';
import { recordApi } from '../../data/api/recordApi';
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
  const { data, isLoading, error, refetch } = useFetcher(
    () => recordApi.getStats(),
    [],
    defaultStats,
  );

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
};
