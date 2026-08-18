import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Schedule } from "@/shared/api";

/**
 * 服薬スケジュールの作成・削除。
 *
 * 呼び出し側が入力欄のリセットを onSuccess で行うため、差し込み口を受ける。
 */

export type CreateScheduleBody = {
  medicationId: string;
  memberId?: string;
  scheduledTime: string;
  daysOfWeek?: string[];
  reminderMinutesBefore?: number;
};

export function useCreateSchedule(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateScheduleBody) => api.post<Schedule>("/schedules", body),
    onSuccess: () => {
      onSuccess?.();
      qc.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.schedules.all }),
  });
}
