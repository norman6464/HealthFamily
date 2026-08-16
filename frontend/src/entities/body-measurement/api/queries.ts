import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { BodyMeasurement, Member } from "@/shared/api";
import type { BodyMeasurementView } from "../model/bodyMeasurement";

/**
 * 体重・身長の計測記録一覧（新しい順）。
 * 表示用にメンバー名を解決したいので members を受け取る。
 */
export function useBodyMeasurements(members: Member[] | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.bodyMeasurements.all,
    queryFn: () => api.get<BodyMeasurement[]>("/body-measurements"),
  });

  const measurements: BodyMeasurementView[] = (data ?? [])
    .map((m) => ({
      id: m.id,
      memberId: m.memberId,
      memberName: members?.find((x) => x.id === m.memberId)?.name || undefined,
      weight: m.weight ?? undefined,
      height: m.height ?? undefined,
      recordedAt: m.recordedAt,
      notes: m.notes ?? undefined,
    }))
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );

  return { measurements, isLoading };
}
