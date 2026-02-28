/**
 * スケジュール管理カスタムフック（ViewModel）
 * Presentation層とDomain層を繋ぐ
 */

import { useState, useCallback, useMemo } from 'react';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { getDIContainer } from '../../infrastructure/DIContainer';

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
  const scheduleRepository = useMemo(() => getDIContainer().scheduleRepository, []);
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
  }, [scheduleRepository]);

  return {
    isCreating,
    error,
    createSchedule: handleCreateSchedule,
  };
};
