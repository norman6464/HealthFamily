import { useFetcher } from './useFetcher';
import { apiClient } from '../../data/api/apiClient';

export interface MissedDose {
  date: string;
  scheduleId: string;
  medicationName: string;
  memberName: string;
  memberId: string;
  scheduledTime: string;
}

export interface UseMissedDosesResult {
  missedDoses: MissedDose[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useMissedDoses = (): UseMissedDosesResult => {
  const { data: missedDoses, isLoading, error, refetch } = useFetcher(
    () => apiClient.get<MissedDose[]>('/schedules/missed'),
    [],
    [] as MissedDose[],
    'missed-doses',
  );

  return { missedDoses, isLoading, error, refetch };
};
