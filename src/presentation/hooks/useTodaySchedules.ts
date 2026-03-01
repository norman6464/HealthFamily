/**
 * 今日のスケジュール取得カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useCallback, useMemo } from 'react';
import { GetTodaySchedules, TodayScheduleViewModel } from '../../domain/usecases/GetTodaySchedules';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface UseTodaySchedulesResult {
  schedules: TodayScheduleViewModel[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  markAsCompleted: (scheduleId: string) => Promise<void>;
}

export const useTodaySchedules = (userId: string): UseTodaySchedulesResult => {
  const { scheduleRepository, getTodaySchedulesUseCase } = useMemo(() => {
    const container = getDIContainer();
    return {
      scheduleRepository: container.scheduleRepository,
      getTodaySchedulesUseCase: new GetTodaySchedules(container.scheduleRepository),
    };
  }, []);

  const [markError, setMarkError] = useState<Error | null>(null);

  const { data: schedules, isLoading, error: fetchError, refetch } = useFetcher(
    () => getTodaySchedulesUseCase.execute({ userId, date: new Date() }),
    [userId, getTodaySchedulesUseCase],
    [] as TodayScheduleViewModel[],
  );

  const markAsCompleted = useCallback(async (scheduleId: string) => {
    try {
      await scheduleRepository.markAsCompleted(scheduleId, new Date());
      await refetch();
    } catch (err) {
      setMarkError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [scheduleRepository, refetch]);

  return {
    schedules,
    isLoading,
    error: fetchError || markError,
    refetch,
    markAsCompleted,
  };
};
