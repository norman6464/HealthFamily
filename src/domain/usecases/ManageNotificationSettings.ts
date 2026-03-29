import { NotificationSetting } from '../entities/NotificationSetting';
import {
  NotificationSettingRepository,
  UpdateNotificationSettingInput,
} from '../repositories/NotificationSettingRepository';

export class GetNotificationSetting {
  constructor(private readonly repository: NotificationSettingRepository) {}

  async execute(): Promise<NotificationSetting | null> {
    return this.repository.get();
  }
}

export class UpdateNotificationSetting {
  constructor(private readonly repository: NotificationSettingRepository) {}

  private static readonly ALLOWED_MINUTES = new Set([0, 5, 10, 15, 30, 60]);
  private static readonly ALLOWED_DAYS = new Set([0, 1, 2, 3, 7]);

  async execute(input: UpdateNotificationSettingInput): Promise<NotificationSetting> {
    if (input.defaultReminderMinutesBefore !== undefined) {
      if (input.defaultReminderMinutesBefore < 0) {
        throw new Error('リマインダー時間は0以上で指定してください');
      }
      if (!UpdateNotificationSetting.ALLOWED_MINUTES.has(input.defaultReminderMinutesBefore)) {
        throw new Error('リマインダー時間の値が不正です');
      }
    }
    if (input.defaultAppointmentReminderDaysBefore !== undefined) {
      if (input.defaultAppointmentReminderDaysBefore < 0) {
        throw new Error('リマインダー日数は0以上で指定してください');
      }
      if (!UpdateNotificationSetting.ALLOWED_DAYS.has(input.defaultAppointmentReminderDaysBefore)) {
        throw new Error('リマインダー日数の値が不正です');
      }
    }
    return this.repository.upsert(input);
  }
}
