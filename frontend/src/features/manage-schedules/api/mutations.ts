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

/**
 * スケジュールの再開・停止。
 *
 * 停止したスケジュールは「今日の予定」に出なくなる。画面に区別が
 * 出ていなかったため、薬は登録されているのに予定に出ない状態から
 * 利用者が自力で復帰できなかった。ここを操作できるようにする。
 *
 * 今日の予定は別のキーで持っているので、そちらも取り直す。
 * 片方だけだと、再開しても当日の一覧に現れない。
 */
export function useSetScheduleEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      api.patch<Schedule>(`/schedules/${id}`, { isEnabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedules.all });
      qc.invalidateQueries({ queryKey: queryKeys.schedules.today });
    },
  });
}
