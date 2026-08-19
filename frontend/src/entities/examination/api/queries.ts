import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Examination } from "@/shared/api";

/** Examination の一覧。呼び出し側が取得を遅らせたい場合があるので enabled を受ける。 */
export function useExaminations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.examinations.all,
    queryFn: () => api.get<Examination[]>("/examinations"),
    enabled: options?.enabled,
  });
}
