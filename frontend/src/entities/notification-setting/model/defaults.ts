// サーバに設定行がまだ無いユーザーに見せる既定値。
export const DEFAULT_NOTIFICATION_SETTING = {
  medicationReminderEnabled: true,
  missedMedicationEnabled: true,
  appointmentReminderEnabled: true,
  lowStockAlertEnabled: true,
  defaultReminderMinutesBefore: 5,
  defaultAppointmentReminderDaysBefore: 1,
  emailNotificationEnabled: true,
} as const;
