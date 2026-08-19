import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Allergy } from "@/shared/api";

/** Allergy の一覧。呼び出し側が取得を遅らせたい場合があるので enabled を受ける。 */
export function useAllergies(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.allergies.all,
    queryFn: () => api.get<Allergy[]>("/allergies"),
    enabled: options?.enabled,
  });
}
