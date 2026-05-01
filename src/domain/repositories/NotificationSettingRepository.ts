import { NotificationSetting } from '../entities/NotificationSetting';

export interface UpdateNotificationSettingInput {
  medicationReminderEnabled?: boolean;
  missedMedicationEnabled?: boolean;
  appointmentReminderEnabled?: boolean;
  lowStockAlertEnabled?: boolean;
  defaultReminderMinutesBefore?: number;
  defaultAppointmentReminderDaysBefore?: number;
  emailNotificationEnabled?: boolean;
  lineNotificationEnabled?: boolean;
}

export interface NotificationSettingRepository {
  get(): Promise<NotificationSetting | null>;
  upsert(input: UpdateNotificationSettingInput): Promise<NotificationSetting>;
}
