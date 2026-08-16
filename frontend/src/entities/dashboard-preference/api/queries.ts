import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { DashboardPreference } from "@/shared/api";

/** ダッシュボードの表示設定 (カードの表示可否・並び順・既定メンバー)。 */
export function useDashboardPreference(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.dashboardPreferences.all,
    queryFn: () => api.get<DashboardPreference>("/dashboard-preferences"),
    enabled: options?.enabled,
  });
}
