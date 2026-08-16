import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";

/** 服薬記録を削除する。 */
export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => api.delete(`/records/${recordId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.records.all }),
  });
}
