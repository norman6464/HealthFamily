import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";

/** 薬を削除し、そのメンバーの薬一覧を再取得させる。 */
export function useDeleteMedication(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/medications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medications.byMember(memberId) });
      qc.invalidateQueries({ queryKey: queryKeys.medications.all });
    },
  });
}
