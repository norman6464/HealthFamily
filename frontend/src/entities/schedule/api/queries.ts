import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Schedule, TodaySchedule } from "@/shared/api";

/** 登録済みの服薬スケジュール一覧。 */
export function useSchedules(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.schedules.all,
    queryFn: () => api.get<Schedule[]>("/schedules"),
    enabled: options?.enabled,
  });
}

/** 今日服用予定のスケジュール一覧 (服薬済みフラグ付き)。 */
export function useTodaySchedules(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.schedules.today,
    queryFn: () => api.get<TodaySchedule[]>("/schedules/today"),
    enabled: options?.enabled,
  });
}
