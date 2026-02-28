/**
 * 今日のスケジュール取得カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GetTodaySchedules, TodayScheduleViewModel } from '../../domain/usecases/GetTodaySchedules';
import { getDIContainer } from '../../infrastructure/DIContainer';

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

  const [schedules, setSchedules] = useState<TodayScheduleViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getTodaySchedulesUseCase.execute({
        userId,
        date: new Date(),
      });

      setSchedules(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, getTodaySchedulesUseCase]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const markAsCompleted = useCallback(async (scheduleId: string) => {
    try {
      await scheduleRepository.markAsCompleted(scheduleId, new Date());
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, [scheduleRepository, fetchSchedules]);

  return {
    schedules,
    isLoading,
    error,
    refetch: fetchSchedules,
    markAsCompleted,
  };
};
