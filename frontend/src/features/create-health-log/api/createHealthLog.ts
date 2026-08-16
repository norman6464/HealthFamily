import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { HealthLog } from "@/shared/api";

export interface CreateHealthLogInput {
  memberId: string;
  conditionLevel: number;
  symptoms?: string[];
  notes?: string;
}

/** 体調を記録し、一覧キャッシュを無効化する。記録時刻は送信時点とする。 */
export function useCreateHealthLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHealthLogInput) =>
      api.post<HealthLog>("/health-logs", {
        memberId: input.memberId,
        conditionLevel: input.conditionLevel,
        symptoms: input.symptoms,
        notes: input.notes,
        recordedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.healthLogs.all });
    },
  });
}
