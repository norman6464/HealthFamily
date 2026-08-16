import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { EmergencyContact } from "@/shared/api";

/** 緊急連絡先の一覧を取得する。 */
export function useEmergencyContacts() {
  return useQuery({
    queryKey: queryKeys.emergencyContacts.all,
    queryFn: () => api.get<EmergencyContact[]>("/emergency-contacts"),
  });
}

/**
 * 緊急連絡先の変更後の無効化範囲。
 * 作成/更新/削除の各 feature が同一の範囲を無効化するため entities 側に置く。
 */
export function useInvalidateEmergencyContacts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.emergencyContacts.all });
  };
}
