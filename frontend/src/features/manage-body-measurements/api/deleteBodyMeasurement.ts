import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";

/** 計測記録を削除し、一覧キャッシュを無効化する。 */
export function useDeleteBodyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/body-measurements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bodyMeasurements.all });
    },
  });
}
