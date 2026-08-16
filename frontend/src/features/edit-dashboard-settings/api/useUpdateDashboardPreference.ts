import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { DashboardPreference } from "@/shared/api";

export interface UpdateDashboardPreferenceInput {
  hiddenCards: string[];
  cardOrder: string[];
  defaultMemberId: string | null;
}

/** ダッシュボードの表示設定を保存する。 */
export function useUpdateDashboardPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDashboardPreferenceInput) =>
      api.put<DashboardPreference>("/dashboard-preferences", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboardPreferences.all });
    },
  });
}
