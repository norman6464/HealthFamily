/**
 * 今日のスケジュール取得カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useEffect } from 'react';
import { GetTodaySchedules, TodayScheduleViewModel } from '../../domain/usecases/GetTodaySchedules';
import { ScheduleRepositoryImpl } from '../../data/repositories/ScheduleRepositoryImpl';

// 依存性注入（DI）
const scheduleRepository = new ScheduleRepositoryImpl();
const getTodaySchedulesUseCase = new GetTodaySchedules(scheduleRepository);

export interface UseTodaySchedulesResult {
  schedules: TodayScheduleViewModel[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  markAsCompleted: (scheduleId: string) => Promise<void>;
}

export const useTodaySchedules = (userId: string): UseTodaySchedulesResult => {
  const [schedules, setSchedules] = useState<TodayScheduleViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSchedules = async () => {
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
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const markAsCompleted = async (scheduleId: string) => {
    try {
      await scheduleRepository.markAsCompleted(scheduleId, new Date());
      // 完了後にスケジュールを再取得して表示を更新
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  };

  return {
    schedules,
    isLoading,
    error,
    refetch: fetchSchedules,
    markAsCompleted,
  };
};
