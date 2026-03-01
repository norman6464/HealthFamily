/**
 * スケジュール管理ユースケース
 */

import { Schedule } from '../entities/Schedule';
import { ScheduleRepository, ScheduleWithDetails } from '../repositories/ScheduleRepository';

export class GetSchedules {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(): Promise<ScheduleWithDetails[]> {
    return this.scheduleRepository.getSchedules();
  }
}

export class UpdateSchedule {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(scheduleId: string, input: Partial<Schedule>): Promise<Schedule> {
    if (!scheduleId) {
      throw new Error('スケジュールIDは必須です');
    }
    if (Object.keys(input).length === 0) {
      throw new Error('更新するフィールドがありません');
    }
    return this.scheduleRepository.updateSchedule(scheduleId, input);
  }
}

export class DeleteSchedule {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async execute(scheduleId: string): Promise<void> {
    if (!scheduleId) {
      throw new Error('スケジュールIDは必須です');
    }
    return this.scheduleRepository.deleteSchedule(scheduleId);
  }
}
