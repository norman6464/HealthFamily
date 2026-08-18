import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";

export interface CreatePastRecordInput {
  memberId: string;
  medicationId: string;
  takenAt: string;
  notes?: string;
}

/** 履歴画面から過去日の服薬記録を追加する。 */
export function useCreatePastRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePastRecordInput) => api.post("/records", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.records.all }),
  });
}
