import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Vaccination } from "@/shared/api";

/** Vaccination の一覧。呼び出し側が取得を遅らせたい場合があるので enabled を受ける。 */
export function useVaccinations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.vaccinations.all,
    queryFn: () => api.get<Vaccination[]>("/vaccinations"),
    enabled: options?.enabled,
  });
}
