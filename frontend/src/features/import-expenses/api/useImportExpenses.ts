import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import { useInvalidateExpenses } from "@/entities/expense";

/** CSV から起こした取込行 */
export interface ImportExpense {
  memberId: string | null;
  category: string;
  amount: number;
  description?: string;
  expenseDate: string;
  isDeductible?: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

/**
 * 支出を一括取込する。
 * 取込によって当月の支出が増えるため、予算超過判定も併せて無効化する。
 */
export function useImportExpenses(year: number) {
  const qc = useQueryClient();
  const invalidateExpenses = useInvalidateExpenses(year);
  return useMutation({
    mutationFn: (expenses: ImportExpense[]) =>
      api.post<ImportResult>("/expenses/import", { expenses }),
    onSuccess: () => {
      invalidateExpenses();
      qc.invalidateQueries({ queryKey: queryKeys.budget.alert });
    },
  });
}
