import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Medication } from "@/shared/api";
import type { MedicationFormData } from "@/entities/medication";

/**
 * 薬の内容を更新する。
 * 未入力欄は null を送り、サーバー側の値をクリアする。
 */
export function useUpdateMedication(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MedicationFormData }) =>
      api.patch<Medication>(`/medications/${id}`, {
        name: data.name,
        dosageAmount: data.dosage || null,
        frequency: data.frequency || null,
        stockQuantity: data.stockQuantity ?? null,
        stockAlertDate: data.stockAlertDate ?? null,
        instructions: data.instructions ?? null,
        status: data.status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medications.byMember(memberId) });
    },
  });
}
