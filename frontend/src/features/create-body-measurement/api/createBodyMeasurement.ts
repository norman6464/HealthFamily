import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { BodyMeasurement } from "@/shared/api";

export interface BodyMeasurementFormData {
  memberId: string;
  weight?: number;
  height?: number;
  recordedAt: string;
  notes?: string;
}

/** 体重・身長を記録し、一覧キャッシュを無効化する。 */
export function useCreateBodyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BodyMeasurementFormData) =>
      api.post<BodyMeasurement>("/body-measurements", {
        memberId: input.memberId,
        weight: input.weight,
        height: input.height,
        recordedAt: new Date(input.recordedAt).toISOString(),
        notes: input.notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bodyMeasurements.all });
    },
  });
}
