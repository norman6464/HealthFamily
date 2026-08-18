import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";

/** 体温記録を削除し、一覧キャッシュを無効化する。 */
export function useDeleteTemperatureRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/temperature-records/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.temperatureRecords.all });
    },
  });
}
