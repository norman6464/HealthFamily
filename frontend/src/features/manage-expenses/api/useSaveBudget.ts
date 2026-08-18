import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Budget } from "@/shared/api";
import type { BudgetSavePayload } from "@/entities/budget";

/** 月次予算とカテゴリ別予算を保存し、予算と超過判定を無効化する。 */
export function useSaveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BudgetSavePayload) => api.put<Budget>("/budget", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.budget.all });
      qc.invalidateQueries({ queryKey: queryKeys.budget.alert });
    },
  });
}
