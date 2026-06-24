-- name: GetNotificationSettingByUserID :one
SELECT "id", "userId", "medicationReminderEnabled", "missedMedicationEnabled",
       "appointmentReminderEnabled", "lowStockAlertEnabled", "defaultReminderMinutesBefore",
       "defaultAppointmentReminderDaysBefore", "emailNotificationEnabled", "createdAt", "updatedAt"
FROM "NotificationSetting"
WHERE "userId" = $1;
