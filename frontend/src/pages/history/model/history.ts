import { useMemo } from "react";
import type { HealthLog, Member } from "@/shared/api";
import { useHealthLogs } from "@/entities/health-log";
import { useMedications } from "@/entities/medication";
import { useMembers } from "@/entities/member";
import {
  groupByDate,
  useMedicationRecords,
  type DailyRecordGroup,
  type EnrichedRecord,
} from "@/entities/medication-record";
import { useDeleteRecord } from "@/features/delete-record";

interface UseMedicationHistoryResult {
  groups: DailyRecordGroup[];
  records: EnrichedRecord[];
  healthLogs: HealthLog[];
  members: Member[];
  isLoading: boolean;
  deleteRecord: (recordId: string) => Promise<void>;
}

/**
 * 服薬履歴画面のデータ。
 * 記録には氏名・薬名が入っていないため、メンバー/薬の一覧と突き合わせて補完する。
 */
export function useMedicationHistory(): UseMedicationHistoryResult {
  const { data: rawRecords, isLoading: recordsLoading } = useMedicationRecords();
  const { data: members } = useMembers();
  const { data: medications } = useMedications();
  const { data: healthLogs } = useHealthLogs();

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

  const deleteMutation = useDeleteRecord();

  return {
    groups,
    records: enriched,
    healthLogs: healthLogs ?? [],
    members: members ?? [],
    isLoading: recordsLoading,
    deleteRecord: async (recordId: string) => {
      await deleteMutation.mutateAsync(recordId);
    },
  };
}
