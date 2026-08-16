import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Medication } from "@/shared/api";
import type { MedicationFormData } from "@/entities/medication";

/** メンバーに薬を追加し、そのメンバーの薬一覧を再取得させる。 */
export function useCreateMedication(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MedicationFormData) =>
      api.post<Medication>("/medications", {
        memberId,
        name: data.name,
        category: data.category,
        dosageAmount: data.dosage || undefined,
        frequency: data.frequency || undefined,
        stockQuantity: data.stockQuantity,
        stockAlertDate: data.stockAlertDate,
        instructions: data.instructions,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medications.byMember(memberId) });
    },
  });
}
