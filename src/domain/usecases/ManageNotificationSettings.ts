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

  async execute(input: UpdateNotificationSettingInput): Promise<NotificationSetting> {
    if (input.defaultReminderMinutesBefore !== undefined && input.defaultReminderMinutesBefore < 0) {
      throw new Error('リマインダー時間は0以上で指定してください');
    }
    if (input.defaultAppointmentReminderDaysBefore !== undefined && input.defaultAppointmentReminderDaysBefore < 0) {
      throw new Error('リマインダー日数は0以上で指定してください');
    }
    return this.repository.upsert(input);
  }
}
