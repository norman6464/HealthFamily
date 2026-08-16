import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Expense } from "@/shared/api";
import { useInvalidateExpenses, type UpdateExpenseInput } from "@/entities/expense";

/** 支出を更新する。表示中の年の一覧・集計を無効化する。 */
export function useUpdateExpense(year: number) {
  const invalidate = useInvalidateExpenses(year);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseInput }) =>
      api.patch<Expense>(`/expenses/${id}`, input),
    onSuccess: invalidate,
  });
}
