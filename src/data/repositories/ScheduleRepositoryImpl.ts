/**
 * スケジュールリポジトリの実装
 * Domain層のインターフェースを実装
 */

import {
  ScheduleRepository,
  TodayScheduleQuery,
  TodayScheduleItem,
} from '../../domain/repositories/ScheduleRepository';
import { Schedule } from '../../domain/entities/Schedule';
import { scheduleApi } from '../api/scheduleApi';

export class ScheduleRepositoryImpl implements ScheduleRepository {
  async getTodaySchedules(query: TodayScheduleQuery): Promise<TodayScheduleItem[]> {
    return await scheduleApi.getTodaySchedules(query.userId, query.date);
  }

  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    return await scheduleApi.createSchedule(schedule);
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule> {
    return await scheduleApi.updateSchedule(id, schedule);
  }

  async deleteSchedule(id: string): Promise<void> {
    await scheduleApi.deleteSchedule(id);
  }

  async markAsCompleted(scheduleId: string, completedAt: Date): Promise<void> {
    await scheduleApi.markAsCompleted(scheduleId, completedAt);
  }
}
