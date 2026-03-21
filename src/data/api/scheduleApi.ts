import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { TodayScheduleItem } from '../../domain/repositories/ScheduleRepository';
import { apiClient } from './apiClient';
import { BackendSchedule } from './types';
import { toSchedule } from './mappers';

export interface ScheduleWithDetails {
  schedule: Schedule;
  medicationName: string;
  memberName: string;
}

interface TodayScheduleResponse {
  id: string;
  medicationId: string;
  medicationName: string;
  userId: string;
  memberId: string;
  memberName: string;
  memberType: string;
  scheduledTime: string;
  daysOfWeek: string[];
  intervalDays?: number;
  startDate?: string;
  isEnabled: boolean;
  reminderMinutesBefore: number;
  medicationDisplayOrder?: number;
  isCompleted: boolean;
  createdAt: string;
}

const VALID_DAYS: readonly string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const scheduleApi = {
  async getSchedules(): Promise<ScheduleWithDetails[]> {
    const items = await apiClient.get<TodayScheduleResponse[]>('/schedules/all');
    return items.map((item) => ({
      schedule: {
        id: item.id,
        medicationId: item.medicationId,
        userId: item.userId,
        memberId: item.memberId,
        scheduledTime: item.scheduledTime,
        daysOfWeek: (item.daysOfWeek?.filter((d) => VALID_DAYS.includes(d)) as DayOfWeek[]) ?? [],
        intervalDays: item.intervalDays ?? undefined,
        startDate: item.startDate ? new Date(item.startDate) : undefined,
        isEnabled: item.isEnabled,
        reminderMinutesBefore: item.reminderMinutesBefore ?? 10,
        createdAt: new Date(item.createdAt),
      },
      medicationName: item.medicationName,
      memberName: item.memberName,
    }));
  },

  async getTodaySchedules(_userId: string, _date: Date): Promise<TodayScheduleItem[]> {
    const items = await apiClient.get<TodayScheduleResponse[]>('/schedules/today');
    return items.map((item) => ({
      schedule: {
        id: item.id,
        medicationId: item.medicationId,
        userId: item.userId,
        memberId: item.memberId,
        scheduledTime: item.scheduledTime,
        daysOfWeek: (item.daysOfWeek?.filter((d) => VALID_DAYS.includes(d)) as DayOfWeek[]) ?? [],
        intervalDays: item.intervalDays ?? undefined,
        startDate: item.startDate ? new Date(item.startDate) : undefined,
        isEnabled: item.isEnabled,
        reminderMinutesBefore: item.reminderMinutesBefore ?? 10,
        createdAt: new Date(item.createdAt),
      },
      medicationName: item.medicationName,
      memberName: item.memberName,
      memberType: (item.memberType as 'human' | 'pet') || 'human',
      medicationDisplayOrder: item.medicationDisplayOrder ?? 0,
      isCompleted: item.isCompleted,
    }));
  },

  async createSchedule(
    schedule: Omit<Schedule, 'id' | 'createdAt'>
  ): Promise<Schedule> {
    const data = await apiClient.post<BackendSchedule>('/schedules', {
      medicationId: schedule.medicationId,
      memberId: schedule.memberId,
      scheduledTime: schedule.scheduledTime,
      daysOfWeek: [...schedule.daysOfWeek],
      intervalDays: schedule.intervalDays,
      startDate: schedule.startDate?.toISOString(),
      isEnabled: schedule.isEnabled,
      reminderMinutesBefore: schedule.reminderMinutesBefore,
    });
    return toSchedule(data);
  },

  async updateSchedule(id: string, schedule: Partial<Schedule>, clearInterval?: boolean): Promise<Schedule> {
    const body: Record<string, unknown> = {};
    if (schedule.scheduledTime !== undefined) body.scheduledTime = schedule.scheduledTime;
    if (schedule.daysOfWeek !== undefined) body.daysOfWeek = [...schedule.daysOfWeek];
    if (schedule.intervalDays !== undefined) body.intervalDays = schedule.intervalDays;
    if (schedule.startDate !== undefined) body.startDate = schedule.startDate?.toISOString() ?? null;
    if (schedule.isEnabled !== undefined) body.isEnabled = schedule.isEnabled;
    if (schedule.reminderMinutesBefore !== undefined) body.reminderMinutesBefore = schedule.reminderMinutesBefore;
    if (clearInterval) {
      body.intervalDays = null;
      body.startDate = null;
    }

    const data = await apiClient.put<BackendSchedule>(`/schedules/${id}`, body);
    return toSchedule(data);
  },

  async deleteSchedule(id: string): Promise<void> {
    await apiClient.del(`/schedules/${id}`);
  },

  async markAsCompleted(scheduleId: string, _completedAt: Date): Promise<void> {
    const scheduleData = await apiClient.get<BackendSchedule>(`/schedules/${scheduleId}`).catch(() => null);
    if (!scheduleData) return;

    await apiClient.post('/records', {
      memberId: scheduleData.memberId,
      medicationId: scheduleData.medicationId,
      scheduleId,
    });
  },
};
