import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";

/** 体調記録を削除し、一覧キャッシュを無効化する。 */
export function useDeleteHealthLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/health-logs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.healthLogs.all });
    },
  });
}
