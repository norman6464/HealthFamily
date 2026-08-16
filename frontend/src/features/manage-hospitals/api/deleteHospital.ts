import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";

/** 病院を削除し、一覧キャッシュを無効化する。 */
export function useDeleteHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/hospitals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.hospitals.all });
    },
  });
}
