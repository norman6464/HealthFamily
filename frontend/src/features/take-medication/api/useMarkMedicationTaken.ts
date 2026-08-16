import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api";

/**
 * お薬一覧から、スケジュールに紐づかない服薬を記録する。
 * takenAt を渡すと過去日の記録になる。
 *
 * 記録後のキャッシュ無効化は行わない (お薬一覧の表示内容が記録に依存しないため)。
 */
export function useMarkMedicationTaken(memberId: string) {
  return useMutation({
    mutationFn: ({ medicationId, takenAt }: { medicationId: string; takenAt?: string }) =>
      api.post("/records", {
        memberId,
        medicationId,
        ...(takenAt ? { takenAt } : {}),
      }),
  });
}
