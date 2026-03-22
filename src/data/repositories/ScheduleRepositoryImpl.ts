/**
 * スケジュールリポジトリの実装
 * Domain層のインターフェースを実装
 */

import {
  ScheduleRepository,
  ScheduleWithDetails,
  TodayScheduleQuery,
  TodayScheduleItem,
} from '../../domain/repositories/ScheduleRepository';
import { Schedule } from '../../domain/entities/Schedule';
import { scheduleApi } from '../api/scheduleApi';

export class ScheduleRepositoryImpl implements ScheduleRepository {
  async getSchedules(): Promise<ScheduleWithDetails[]> {
    return await scheduleApi.getSchedules();
  }

  async getSchedulesRaw(): Promise<Schedule[]> {
    // フロントエンドからは使用しない（サーバーサイド専用）
    return [];
  }

  async getTodaySchedules(query: TodayScheduleQuery): Promise<TodayScheduleItem[]> {
    return await scheduleApi.getTodaySchedules(query.userId, query.date);
  }

  async findOverlapping(_medicationId: string, _scheduledTime: string): Promise<Schedule | null> {
    // フロントエンドからは使用しない（サーバーサイド専用）
    return null;
  }

  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    return await scheduleApi.createSchedule(schedule);
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>, options?: { clearInterval?: boolean }): Promise<Schedule> {
    return await scheduleApi.updateSchedule(id, schedule, options?.clearInterval);
  }

  async deleteSchedule(id: string): Promise<void> {
    await scheduleApi.deleteSchedule(id);
  }

  async markAsCompleted(scheduleId: string, completedAt: Date): Promise<void> {
    await scheduleApi.markAsCompleted(scheduleId, completedAt);
  }
}
