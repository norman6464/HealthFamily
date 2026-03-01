/**
 * スケジュール管理カスタムフック
 * 全スケジュールの取得・更新・削除
 */

import { useMemo, useState, useCallback } from 'react';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { ScheduleWithDetails } from '../../domain/repositories/ScheduleRepository';
import { GetSchedules, UpdateSchedule, DeleteSchedule, CreateSchedule } from '../../domain/usecases/ManageSchedules';
import { getDIContainer } from '../../infrastructure/DIContainer';
import { useFetcher } from './useFetcher';

export interface CreateScheduleInput {
  medicationId: string;
  userId: string;
  memberId: string;
  scheduledTime: string;
  daysOfWeek: DayOfWeek[];
  reminderMinutesBefore: number;
}

export interface UseSchedulesResult {
  schedules: ScheduleWithDetails[];
  isLoading: boolean;
  isCreating: boolean;
  error: Error | null;
  createSchedule: (input: CreateScheduleInput) => Promise<void>;
  updateSchedule: (scheduleId: string, input: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useSchedules = (): UseSchedulesResult => {
  const useCases = useMemo(() => {
    const { scheduleRepository } = getDIContainer();
    return {
      getSchedules: new GetSchedules(scheduleRepository),
      createSchedule: new CreateSchedule(scheduleRepository),
      updateSchedule: new UpdateSchedule(scheduleRepository),
      deleteSchedule: new DeleteSchedule(scheduleRepository),
    };
  }, []);

  const { data: schedules, isLoading, error, refetch } = useFetcher(
    () => useCases.getSchedules.execute(),
    [useCases],
    [] as ScheduleWithDetails[],
  );

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSchedule = useCallback(async (input: CreateScheduleInput) => {
    setIsCreating(true);
    try {
      await useCases.createSchedule.execute({
        medicationId: input.medicationId,
        userId: input.userId,
        memberId: input.memberId,
        scheduledTime: input.scheduledTime,
        daysOfWeek: input.daysOfWeek,
        isEnabled: true,
        reminderMinutesBefore: input.reminderMinutesBefore,
      });
      await refetch();
    } finally {
      setIsCreating(false);
    }
  }, [useCases, refetch]);

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
    isCreating,
    error,
    createSchedule: handleCreateSchedule,
    updateSchedule: handleUpdateSchedule,
    deleteSchedule: handleDeleteSchedule,
    refetch,
  };
};
