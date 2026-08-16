import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Appointment } from "@/shared/api";

/** 通院予定の一覧。呼び出し側が取得を遅らせたい場合があるので enabled を受ける。 */
export function useAppointments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.appointments.all,
    queryFn: () => api.get<Appointment[]>("/appointments"),
    enabled: options?.enabled,
  });
}
