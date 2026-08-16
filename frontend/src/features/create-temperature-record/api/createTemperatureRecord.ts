import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { TemperatureRecord } from "@/shared/api";

export interface TemperatureFormData {
  memberId: string;
  temperature: number;
  measuredAt: string;
  notes?: string;
}

/** 体温を記録し、一覧キャッシュを無効化する。 */
export function useCreateTemperatureRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TemperatureFormData) =>
      api.post<TemperatureRecord>("/temperature-records", {
        memberId: input.memberId,
        temperature: input.temperature,
        measuredAt: input.measuredAt,
        notes: input.notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.temperatureRecords.all });
    },
  });
}
