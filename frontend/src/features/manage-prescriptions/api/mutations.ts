import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Medication, Prescription } from "@/shared/api";

/**
 * 処方箋に紐づく操作。
 *
 * 薬を作る2つの経路 (処方箋そのものから / 明細から調剤) は、
 * 無効化するキーをここで揃える。画面ごとに書いていたため、
 * 片方がメンバー別の一覧を取り直さず、登録しても出てこない状態だった。
 */

function invalidateMedications(qc: ReturnType<typeof useQueryClient>, memberId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.medications.all });
  qc.invalidateQueries({ queryKey: queryKeys.medications.byMember(memberId) });
}

/** 処方箋の名前でそのまま薬を1つ作る。 */
export function useRegisterMedicationFromPrescription(prescription: Prescription) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<Medication>("/medications", {
        memberId: prescription.memberId,
        name: prescription.prescriptionName,
      }),
    onSuccess: () => invalidateMedications(qc, prescription.memberId),
  });
}

/** 明細をまとめて薬に落とす。 */
export function useDispensePrescription(prescription: Prescription) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Medication[]>(`/prescriptions/${prescription.id}/dispense`),
    onSuccess: () => invalidateMedications(qc, prescription.memberId),
  });
}

export type SaveItemsPayload = {
  name: string;
  dosage?: string;
  frequency?: string;
  days?: number;
};

/** 明細の差し替え。呼び出し側が編集モードを閉じるため差し込み口を受ける。 */
export function useSavePrescriptionItems(prescriptionId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: SaveItemsPayload[]) =>
      api.put<Prescription>(`/prescriptions/${prescriptionId}/items`, { items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.all });
      onSuccess?.();
    },
  });
}
