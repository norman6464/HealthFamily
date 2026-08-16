import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Budget, BudgetAlertStatus } from "@/shared/api";

/** 月次予算(カテゴリ別予算を含む)を取得する。 */
export function useBudget() {
  return useQuery({
    queryKey: queryKeys.budget.all,
    queryFn: () => api.get<Budget>("/budget"),
  });
}

/**
 * 予算超過を判定する。
 * サーバ側でメールアラートの送信判定も行うため GET ではなく POST になっている。
 */
export function useBudgetAlert() {
  return useQuery({
    queryKey: queryKeys.budget.alert,
    queryFn: () => api.post<BudgetAlertStatus>("/budget/alert"),
  });
}
