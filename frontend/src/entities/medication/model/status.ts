import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Medication } from "@/shared/api";

// 薬の服用状態そのものの操作。複数の画面から使うため entities に置く。
export type MedicationStatus = "active" | "paused" | "discontinued";

/**
 * 薬のステータス(休薬中トグル等)を変更し、関連クエリを無効化する。
 */
export function useUpdateMedicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ medicationId, status }: { medicationId: string; status: MedicationStatus }) =>
      api.patch<Medication>(`/medications/${medicationId}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medications.all });
      qc.invalidateQueries({ queryKey: queryKeys.schedules.today });
      qc.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });
}
