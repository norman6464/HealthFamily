import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { Member, TemperatureRecord } from "@/shared/api";
import type { TemperatureRecordView } from "../model/temperatureRecord";

/**
 * 体温記録の一覧（新しい順）。表示用にメンバー名を解決したいので members を受け取る。
 */
export function useTemperatureRecords(members: Member[] | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.temperatureRecords.all,
    queryFn: () => api.get<TemperatureRecord[]>("/temperature-records"),
  });

  const records: TemperatureRecordView[] = (data ?? [])
    .map((r) => ({
      id: r.id,
      memberId: r.memberId,
      memberName: members?.find((m) => m.id === r.memberId)?.name || undefined,
      temperature: r.temperature,
      measuredAt: new Date(r.measuredAt),
      notes: r.notes ?? undefined,
    }))
    .sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());

  return { records, isLoading };
}
