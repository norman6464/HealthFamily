import {
  NotificationSettingRepository,
  UpdateNotificationSettingInput,
} from '../../domain/repositories/NotificationSettingRepository';
import { NotificationSetting } from '../../domain/entities/NotificationSetting';
import { notificationSettingApi } from '../api/notificationSettingApi';

export class NotificationSettingRepositoryImpl implements NotificationSettingRepository {
  async get(): Promise<NotificationSetting | null> {
    return notificationSettingApi.get();
  }

  async upsert(input: UpdateNotificationSettingInput): Promise<NotificationSetting> {
    return notificationSettingApi.upsert(input);
  }
}
