import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { BodyMeasurement } from "@/shared/api";
import type { UpdateBodyMeasurementInput } from "@/entities/body-measurement";

/** 計測記録を更新し、一覧キャッシュを無効化する。 */
export function useUpdateBodyMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBodyMeasurementInput }) =>
      api.patch<BodyMeasurement>(`/body-measurements/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bodyMeasurements.all });
    },
  });
}
