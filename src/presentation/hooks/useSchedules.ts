/**
 * スケジュール管理カスタムフック
 * 全スケジュールの取得・更新・削除
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Schedule } from '../../domain/entities/Schedule';
import { ScheduleWithDetails } from '../../domain/repositories/ScheduleRepository';
import { GetSchedules, UpdateSchedule, DeleteSchedule } from '../../domain/usecases/ManageSchedules';
import { getDIContainer } from '../../infrastructure/DIContainer';

export interface UseSchedulesResult {
  schedules: ScheduleWithDetails[];
  isLoading: boolean;
  error: Error | null;
  updateSchedule: (scheduleId: string, input: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useSchedules = (): UseSchedulesResult => {
  const useCases = useMemo(() => {
    const { scheduleRepository } = getDIContainer();
    return {
      getSchedules: new GetSchedules(scheduleRepository),
      updateSchedule: new UpdateSchedule(scheduleRepository),
      deleteSchedule: new DeleteSchedule(scheduleRepository),
    };
  }, []);

  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await useCases.getSchedules.execute();
      setSchedules(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [useCases]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleUpdateSchedule = async (scheduleId: string, input: Partial<Schedule>) => {
    await useCases.updateSchedule.execute(scheduleId, input);
    await fetchSchedules();
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    await useCases.deleteSchedule.execute(scheduleId);
    await fetchSchedules();
  };

  return {
    schedules,
    isLoading,
    error,
    updateSchedule: handleUpdateSchedule,
    deleteSchedule: handleDeleteSchedule,
    refetch: fetchSchedules,
  };
};
