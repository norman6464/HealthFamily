import { NotificationSetting } from '../../domain/entities/NotificationSetting';
import { UpdateNotificationSettingInput } from '../../domain/repositories/NotificationSettingRepository';
import { apiClient } from './apiClient';

interface BackendNotificationSetting {
  id: string;
  userId: string;
  medicationReminderEnabled: boolean;
  missedMedicationEnabled: boolean;
  appointmentReminderEnabled: boolean;
  lowStockAlertEnabled: boolean;
  defaultReminderMinutesBefore: number;
  defaultAppointmentReminderDaysBefore: number;
  emailNotificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function toNotificationSetting(raw: BackendNotificationSetting): NotificationSetting {
  return {
    id: raw.id,
    userId: raw.userId,
    medicationReminderEnabled: raw.medicationReminderEnabled,
    missedMedicationEnabled: raw.missedMedicationEnabled,
    appointmentReminderEnabled: raw.appointmentReminderEnabled,
    lowStockAlertEnabled: raw.lowStockAlertEnabled,
    defaultReminderMinutesBefore: raw.defaultReminderMinutesBefore,
    defaultAppointmentReminderDaysBefore: raw.defaultAppointmentReminderDaysBefore,
    emailNotificationEnabled: raw.emailNotificationEnabled,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

export const notificationSettingApi = {
  async get(): Promise<NotificationSetting | null> {
    try {
      const data = await apiClient.get<BackendNotificationSetting>('/notification-settings');
      return toNotificationSetting(data);
    } catch {
      return null;
    }
  },

  async upsert(input: UpdateNotificationSettingInput): Promise<NotificationSetting> {
    const data = await apiClient.put<BackendNotificationSetting>('/notification-settings', input);
    return toNotificationSetting(data);
  },
};
