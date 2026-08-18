import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";

/** 薬の表示順を並べ替える。orderedIds は全件を並び順どおりに渡す。 */
export function useReorderMedications(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.post("/medications/reorder", { orderedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medications.byMember(memberId) });
    },
  });
}
