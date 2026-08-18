import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { NotificationSetting } from "@/shared/api";

export type UpdateNotificationSettingInput = Partial<{
  medicationReminderEnabled: boolean;
  missedMedicationEnabled: boolean;
  appointmentReminderEnabled: boolean;
  lowStockAlertEnabled: boolean;
  defaultReminderMinutesBefore: number;
  defaultAppointmentReminderDaysBefore: number;
  emailNotificationEnabled: boolean;
}>;

/** 通知設定を保存する。項目ごとの部分更新を PUT で送る。 */
export function useUpdateNotificationSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotificationSettingInput) =>
      api.put<NotificationSetting>("/notification-settings", input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.notificationSettings.all }),
  });
}
