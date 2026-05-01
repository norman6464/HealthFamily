export type NotificationType =
  | 'medication_reminder'
  | 'missed_medication'
  | 'appointment_reminder'
  | 'low_stock';

export interface NotificationSetting {
  readonly id: string;
  readonly userId: string;
  readonly medicationReminderEnabled: boolean;
  readonly missedMedicationEnabled: boolean;
  readonly appointmentReminderEnabled: boolean;
  readonly lowStockAlertEnabled: boolean;
  readonly defaultReminderMinutesBefore: number;
  readonly defaultAppointmentReminderDaysBefore: number;
  readonly emailNotificationEnabled: boolean;
  readonly lineNotificationEnabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const DEFAULT_NOTIFICATION_SETTING: Omit<NotificationSetting, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  medicationReminderEnabled: true,
  missedMedicationEnabled: true,
  appointmentReminderEnabled: true,
  lowStockAlertEnabled: true,
  defaultReminderMinutesBefore: 5,
  defaultAppointmentReminderDaysBefore: 1,
  emailNotificationEnabled: true,
  lineNotificationEnabled: false,
};

export function createNotificationSetting(
  userId: string,
  overrides?: Partial<Omit<NotificationSetting, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
): Omit<NotificationSetting, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    ...DEFAULT_NOTIFICATION_SETTING,
    ...overrides,
  };
}

export type NotificationChannel = 'email' | 'line';

export function isNotificationTypeEnabled(
  setting: NotificationSetting,
  type: NotificationType,
): boolean {
  switch (type) {
    case 'medication_reminder':
      return setting.medicationReminderEnabled;
    case 'missed_medication':
      return setting.missedMedicationEnabled;
    case 'appointment_reminder':
      return setting.appointmentReminderEnabled;
    case 'low_stock':
      return setting.lowStockAlertEnabled;
  }
}

export function isChannelEnabled(
  setting: NotificationSetting,
  channel: NotificationChannel,
): boolean {
  switch (channel) {
    case 'email':
      return setting.emailNotificationEnabled;
    case 'line':
      return setting.lineNotificationEnabled;
  }
}

export function isNotificationEnabled(
  setting: NotificationSetting,
  type: NotificationType,
  channel: NotificationChannel = 'email',
): boolean {
  return isChannelEnabled(setting, channel) && isNotificationTypeEnabled(setting, type);
}

export function getDefaultReminderMinutes(setting: NotificationSetting): number {
  return setting.defaultReminderMinutesBefore;
}

export const NOTIFICATION_TYPES: ReadonlyArray<{
  key: NotificationType;
  label: string;
  description: string;
}> = [
  {
    key: 'medication_reminder',
    label: '服薬リマインダー',
    description: '服薬時間になったら通知します',
  },
  {
    key: 'missed_medication',
    label: '飲み忘れ通知',
    description: '服薬時間を過ぎても記録がない場合に通知します',
  },
  {
    key: 'appointment_reminder',
    label: '通院リマインダー',
    description: '通院予約の前日に通知します',
  },
  {
    key: 'low_stock',
    label: '在庫アラート',
    description: 'お薬の在庫が少なくなったら通知します',
  },
];
