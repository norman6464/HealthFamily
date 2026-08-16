import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { useInvalidateExpenses } from "@/entities/expense";

/** 支出を削除する。表示中の年の一覧・集計を無効化する。 */
export function useDeleteExpense(year: number) {
  const invalidate = useInvalidateExpenses(year);
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: invalidate,
  });
}
