/**
 * スケジュール管理カスタムフック（ViewModel）
 */

import { useState, useCallback } from 'react';
import { ScheduleRepositoryImpl } from '../../data/repositories/ScheduleRepositoryImpl';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';

const scheduleRepository = new ScheduleRepositoryImpl();

export interface CreateScheduleInput {
  medicationId: string;
  userId: string;
  memberId: string;
  scheduledTime: string;
  daysOfWeek: DayOfWeek[];
  reminderMinutesBefore: number;
}

export interface UseScheduleManagementResult {
  isCreating: boolean;
  error: Error | null;
  createSchedule: (input: CreateScheduleInput) => Promise<void>;
}

export const useScheduleManagement = (): UseScheduleManagementResult => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCreateSchedule = useCallback(async (input: CreateScheduleInput) => {
    try {
      setIsCreating(true);
      setError(null);

      const scheduleData: Omit<Schedule, 'id' | 'createdAt'> = {
        medicationId: input.medicationId,
        userId: input.userId,
        memberId: input.memberId,
        scheduledTime: input.scheduledTime,
        daysOfWeek: input.daysOfWeek,
        isEnabled: true,
        reminderMinutesBefore: input.reminderMinutesBefore,
      };

      await scheduleRepository.createSchedule(scheduleData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    isCreating,
    error,
    createSchedule: handleCreateSchedule,
  };
};
