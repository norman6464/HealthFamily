import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { queryKeys } from "@/shared/api";
import type { MedicationRecord, Member, Medication, HealthLog } from "@/shared/api";

/** 表示用に氏名・薬名を付与した服薬記録 */
export interface EnrichedRecord {
  id: string;
  memberId: string;
  memberName: string;
  medicationId: string;
  medicationName: string;
  takenAt: Date;
  notes?: string;
  dosageAmount?: string;
}

export interface DailyRecordGroup {
  date: string;
  records: EnrichedRecord[];
}

export interface CreateRecordInput {
  memberId: string;
  medicationId: string;
  takenAt: string;
  notes?: string;
}

/** Date を YYYY-MM-DD のローカル日付キーに変換 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

/** 日付を「M月D日(曜)」形式でフォーマット */
export function formatRecordDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return `${date.getMonth() + 1}月${date.getDate()}日(${WEEKDAY_LABELS[date.getDay()]})`;
}

/** 時刻を HH:mm 形式でフォーマット */
export function formatRecordTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** 記録を日付ごとにグループ化（新しい順） */
export function groupByDate(records: EnrichedRecord[]): DailyRecordGroup[] {
  const groups = new Map<string, EnrichedRecord[]>();
  for (const record of records) {
    const dateStr = toDateKey(record.takenAt);
    if (!groups.has(dateStr)) groups.set(dateStr, []);
    groups.get(dateStr)!.push(record);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, recs]) => ({ date, records: recs }));
}

/** メンバーIDでグループをフィルタ（空グループは除外） */
export function filterGroupsByMember(groups: DailyRecordGroup[], memberId: string | null): DailyRecordGroup[] {
  if (memberId === null) return groups;
  return groups
    .map((g) => ({ ...g, records: g.records.filter((r) => r.memberId === memberId) }))
    .filter((g) => g.records.length > 0);
}

interface UseMedicationHistoryResult {
  groups: DailyRecordGroup[];
  records: EnrichedRecord[];
  healthLogs: HealthLog[];
  members: Member[];
  isLoading: boolean;
  deleteRecord: (recordId: string) => Promise<void>;
  createRecord: (input: CreateRecordInput) => Promise<void>;
}

export function useMedicationHistory(): UseMedicationHistoryResult {
  const qc = useQueryClient();

  const { data: rawRecords, isLoading: recordsLoading } = useQuery({
    queryKey: queryKeys.records.all,
    queryFn: () => api.get<MedicationRecord[]>("/records"),
  });

  const { data: members } = useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => api.get<Member[]>("/members"),
  });

  const { data: medications } = useQuery({
    queryKey: queryKeys.medications.all,
    queryFn: () => api.get<Medication[]>("/medications"),
  });

  const { data: healthLogs } = useQuery({
    queryKey: queryKeys.healthLogs.all,
    queryFn: () => api.get<HealthLog[]>("/health-logs"),
  });

  const enriched = useMemo<EnrichedRecord[]>(() => {
    if (!rawRecords) return [];
    const memberMap = new Map((members ?? []).map((m) => [m.id, m.name]));
    const medMap = new Map((medications ?? []).map((m) => [m.id, m.name]));
    return rawRecords.map((r) => ({
      id: r.id,
      memberId: r.memberId,
      memberName: memberMap.get(r.memberId) ?? "",
      medicationId: r.medicationId,
      medicationName: medMap.get(r.medicationId) ?? "",
      takenAt: new Date(r.takenAt),
      notes: r.notes ?? undefined,
      dosageAmount: r.dosageAmount ?? undefined,
    }));
  }, [rawRecords, members, medications]);

  const groups = useMemo(() => groupByDate(enriched), [enriched]);

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => api.delete(`/records/${recordId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.records.all }),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateRecordInput) => api.post("/records", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.records.all }),
  });

  return {
    groups,
    records: enriched,
    healthLogs: healthLogs ?? [],
    members: members ?? [],
    isLoading: recordsLoading,
    deleteRecord: async (recordId: string) => {
      await deleteMutation.mutateAsync(recordId);
    },
    createRecord: async (input: CreateRecordInput) => {
      await createMutation.mutateAsync(input);
    },
  };
}
