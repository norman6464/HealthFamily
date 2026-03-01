/**
 * スケジュール管理カスタムフック
 * 全スケジュールの取得・更新・削除
 */

import { useMemo } from 'react';
import { Schedule } from '../../domain/entities/Schedule';
import { ScheduleWithDetails } from '../../domain/repositories/ScheduleRepository';
import { GetSchedules, UpdateSchedule, DeleteSchedule } from '../../domain/usecases/ManageSchedules';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

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

  const { data: schedules, isLoading, error, refetch } = useFetcher(
    () => useCases.getSchedules.execute(),
    [useCases],
    [] as ScheduleWithDetails[],
  );

  const handleUpdateSchedule = async (scheduleId: string, input: Partial<Schedule>) => {
    await useCases.updateSchedule.execute(scheduleId, input);
    await refetch();
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    await useCases.deleteSchedule.execute(scheduleId);
    await refetch();
  };

  return {
    schedules,
    isLoading,
    error,
    updateSchedule: handleUpdateSchedule,
    deleteSchedule: handleDeleteSchedule,
    refetch,
  };
};
