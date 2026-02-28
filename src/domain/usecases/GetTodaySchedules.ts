/**
 * 今日のスケジュール取得ユースケース
 * ビジネスロジックを集約
 */

import { ScheduleRepository, TodayScheduleItem } from '../repositories/ScheduleRepository';
import { ScheduleEntity, ScheduleStatus } from '../entities/Schedule';

export interface GetTodaySchedulesInput {
  userId: string;
  date?: Date;
}

export interface TodayScheduleViewModel {
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  userId: string;
  memberId: string;
  memberName: string;
  memberType: 'human' | 'pet';
  scheduledTime: string;
  status: ScheduleStatus;
  isEnabled: boolean;
  reminderMinutesBefore: number;
}

export class GetTodaySchedules {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  /**
   * ユースケースの実行
   */
  async execute(input: GetTodaySchedulesInput): Promise<TodayScheduleViewModel[]> {
    const date = input.date || new Date();

    // リポジトリから今日のスケジュール取得
    const items = await this.scheduleRepository.getTodaySchedules({
      userId: input.userId,
      date,
    });

    // ドメインロジックを適用してViewModelに変換
    const viewModels = items
      .filter((item) => {
        const entity = new ScheduleEntity(item.schedule);
        return entity.isActiveOnDay(date);
      })
      .map((item) => this.toViewModel(item, date));

    // 時刻順にソート
    viewModels.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    return viewModels;
  }

  private toViewModel(item: TodayScheduleItem, currentTime: Date): TodayScheduleViewModel {
    const entity = new ScheduleEntity(item.schedule);
    const status = entity.getStatus(currentTime, item.isCompleted);

    return {
      scheduleId: item.schedule.id,
      medicationId: item.schedule.medicationId,
      medicationName: item.medicationName,
      userId: item.schedule.userId,
      memberId: item.schedule.memberId,
      memberName: item.memberName,
      memberType: item.memberType,
      scheduledTime: item.schedule.scheduledTime,
      status,
      isEnabled: item.schedule.isEnabled,
      reminderMinutesBefore: item.schedule.reminderMinutesBefore,
    };
  }
}
