import { useMemo } from 'react';
import { MissedDose } from '../../domain/repositories/ScheduleRepository';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export type { MissedDose };

export interface UseMissedDosesResult {
  missedDoses: MissedDose[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useMissedDoses = (): UseMissedDosesResult => {
  const scheduleRepository = useMemo(() => getDIContainer().scheduleRepository, []);

  const { data: missedDoses, isLoading, error, refetch } = useFetcher(
    () => scheduleRepository.getMissedDoses(),
    [scheduleRepository],
    [] as MissedDose[],
    'missed-doses',
  );

  return { missedDoses, isLoading, error, refetch };
};
