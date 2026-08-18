import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { MedicationRecord } from "@/shared/api";

/** 服薬記録の全件。 */
export function useMedicationRecords(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.records.all,
    queryFn: () => api.get<MedicationRecord[]>("/records"),
    enabled: options?.enabled,
  });
}

/**
 * 直近 days 日分の服薬記録。
 * 集計用途では全件が不要なため、期間を絞って取得量を抑える。
 */
export function useRecentMedicationRecords(days: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.records.window(days),
    queryFn: () => api.get<MedicationRecord[]>(`/records?days=${days}`),
    enabled: options?.enabled,
  });
}
