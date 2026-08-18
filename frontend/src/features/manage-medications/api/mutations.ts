import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Medication } from "@/shared/api";

/**
 * 薬の作成。送る中身は画面ごとに違うので、組み立て済みの body を受ける。
 *
 * onSuccess にはフォームのリセットなど画面固有の後処理が入るため、
 * 差し込み口を引数で受ける。無効化するキーはここで固定する。
 * 画面ごとに書くと、片方だけ取り直しを忘れて一覧が古いまま残る。
 */
export type CreateMedicationBody = Record<string, unknown> & { memberId?: string };

export function useCreateMedicationRaw(memberId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMedicationBody) => api.post<Medication>("/medications", body),
    onSuccess: () => {
      onSuccess?.();
      qc.invalidateQueries({ queryKey: queryKeys.medications.byMember(memberId) });
      qc.invalidateQueries({ queryKey: queryKeys.medications.all });
    },
  });
}
