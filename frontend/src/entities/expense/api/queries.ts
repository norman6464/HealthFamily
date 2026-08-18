import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Expense, ExpenseSummary } from "@/shared/api";

/** 指定年(必要ならメンバー絞り込み)の支出一覧を取得する。 */
export function useExpenses(year: number, memberId: string | null) {
  return useQuery({
    queryKey: queryKeys.expenses.list(year, memberId),
    queryFn: () => {
      const params = new URLSearchParams({ year: String(year) });
      if (memberId) params.set("memberId", memberId);
      return api.get<Expense[]>(`/expenses?${params.toString()}`);
    },
  });
}

/** 指定年の集計(控除シミュレーション込み)を取得する。 */
export function useExpenseSummary(year: number) {
  return useQuery({
    queryKey: queryKeys.expenses.summary(year),
    queryFn: () => api.get<ExpenseSummary>(`/expenses/summary?year=${year}`),
  });
}

/**
 * 支出を変更した後の無効化範囲。
 * 作成/更新/削除/取込の各 feature が同一の範囲を無効化する必要があるため entities 側に置く。
 */
export function useInvalidateExpenses(year: number) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
    qc.invalidateQueries({ queryKey: queryKeys.expenses.summary(year) });
  };
}
