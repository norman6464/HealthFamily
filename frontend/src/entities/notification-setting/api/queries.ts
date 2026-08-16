import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { NotificationSetting } from "@/shared/api";

/** ユーザーの通知設定を取得する。 */
export function useNotificationSetting() {
  return useQuery({
    queryKey: queryKeys.notificationSettings.all,
    queryFn: () => api.get<NotificationSetting>("/notification-settings"),
  });
}
