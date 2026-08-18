import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Schedule } from "@/shared/api";
import type { ScheduleFormData } from "../ui/ScheduleForm";

/** 薬に服薬スケジュールを追加する。 */
export function useCreateSchedule(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ medicationId, data }: { medicationId: string; data: ScheduleFormData }) =>
      api.post<Schedule>("/schedules", {
        medicationId,
        memberId,
        scheduledTime: data.scheduledTime,
        daysOfWeek: data.daysOfWeek,
        intervalDays: data.intervalDays,
        startDate: data.startDate,
        isEnabled: true,
        reminderMinutesBefore: data.reminderMinutesBefore,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });
}
