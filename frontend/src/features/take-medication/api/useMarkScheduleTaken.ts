import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { MedicationRecord } from "@/shared/api";

export interface MarkScheduleTakenInput {
  memberId: string;
  medicationId: string;
  scheduleId: string;
  takenAt?: string;
  notes?: string;
}

/**
 * 今日の予定・飲み忘れ分を「服薬済み」として記録し、関連クエリを無効化する。
 */
export function useMarkScheduleTaken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkScheduleTakenInput) =>
      api.post<MedicationRecord>("/records", {
        memberId: input.memberId,
        medicationId: input.medicationId,
        scheduleId: input.scheduleId,
        ...(input.takenAt ? { takenAt: input.takenAt } : {}),
        ...(input.notes ? { notes: input.notes } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedules.today });
      qc.invalidateQueries({ queryKey: queryKeys.records.all });
    },
  });
}
