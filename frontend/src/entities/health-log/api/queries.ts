import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/shared/api";
import type { HealthLog, Member } from "@/shared/api";
import {
  groupByDate,
  type ConditionLevel,
  type HealthLogView,
  type SymptomType,
} from "../model/healthLog";

/**
 * 体調記録の生の一覧。
 * メンバー詳細のように、加工せず件数や中身だけ見たい画面が使う。
 */
export function useHealthLogs(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.healthLogs.all,
    queryFn: () => api.get<HealthLog[]>("/health-logs"),
    enabled: options?.enabled,
  });
}

/**
 * 表示用に整えた体調記録。メンバー名の解決と日付ごとのまとめを行う。
 * 一覧画面のように、そのまま描画したい側が使う。
 */
export function useHealthLogViews(members: Member[] | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.healthLogs.all,
    queryFn: () => api.get<HealthLog[]>("/health-logs"),
  });

  const logs: HealthLogView[] = (data ?? []).map((h) => ({
    id: h.id,
    memberId: h.memberId,
    memberName: members?.find((m) => m.id === h.memberId)?.name ?? "",
    conditionLevel: (h.conditionLevel as ConditionLevel) ?? 3,
    symptoms: (h.symptoms ?? []) as SymptomType[],
    notes: h.notes ?? undefined,
    recordedAt: new Date(h.recordedAt),
  }));

  return { logs, groups: groupByDate(logs), isLoading };
}
