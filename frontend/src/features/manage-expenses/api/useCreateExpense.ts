import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Expense } from "@/shared/api";
import { useInvalidateExpenses, type ExpenseFormData } from "@/entities/expense";

/** 支出を登録する。表示中の年の一覧・集計を無効化する。 */
export function useCreateExpense(year: number) {
  const invalidate = useInvalidateExpenses(year);
  return useMutation({
    mutationFn: (data: ExpenseFormData) => api.post<Expense>("/expenses", data),
    onSuccess: invalidate,
  });
}
