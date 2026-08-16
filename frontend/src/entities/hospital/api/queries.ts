import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Hospital } from "@/shared/api";

/**
 * 病院一覧。かかりつけ医画面と通院管理画面の双方から参照するため entities に置く。
 * 呼び出し側が取得を遅らせたい場合があるので enabled を受ける。
 */
export function useHospitals(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.hospitals.all,
    queryFn: () => api.get<Hospital[]>("/hospitals"),
    enabled: options?.enabled,
  });
}
