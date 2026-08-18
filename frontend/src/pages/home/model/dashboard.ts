import { useMemo } from "react";
import type { Appointment } from "@/shared/api";
import { useMembers } from "@/entities/member";
import { useMedications } from "@/entities/medication";
import { useRecentMedicationRecords } from "@/entities/medication-record";
import { useAppointments } from "@/entities/appointment";
import { useHospitals } from "@/entities/hospital";
import {
  isActiveOnDay,
  normalizeDays,
  toTodayScheduleViewModels,
  useSchedules,
  useTodaySchedules,
  type DayOfWeek,
  type TodayScheduleViewModel,
} from "@/entities/schedule";

// ---- ダッシュボード固有の集計ロジック ----

// アドヒアランス
function getActiveDaysCount(days: DayOfWeek[]): number {
  return days.length === 0 ? 7 : days.length;
}
function calculateWeeklyExpected(schedules: { daysOfWeek: DayOfWeek[] }[]): number {
  return schedules.reduce((sum, s) => sum + Math.min(getActiveDaysCount(s.daysOfWeek), 7), 0);
}
function calculateMonthlyExpected(schedules: { daysOfWeek: DayOfWeek[] }[]): number {
  return schedules.reduce((sum, s) => sum + Math.round(getActiveDaysCount(s.daysOfWeek) * (30 / 7)), 0);
}
function calculateRate(actual: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.min(100, Math.round((actual / expected) * 100));
}

export function getRateLevel(rate: number): "excellent" | "good" | "warning" | "poor" {
  if (rate >= 90) return "excellent";
  if (rate >= 70) return "good";
  if (rate >= 50) return "warning";
  return "poor";
}
export function getRateLabel(rate: number): string {
  const labels: Record<ReturnType<typeof getRateLevel>, string> = {
    excellent: "優秀",
    good: "良好",
    warning: "注意",
    poor: "要改善",
  };
  return labels[getRateLevel(rate)];
}

// 在庫
export function getRemainingDaysLabel(remainingDays: number | null): string {
  if (remainingDays === null) return "残量不明";
  if (remainingDays === 0) return "在庫切れ";
  return `約${remainingDays}日分`;
}

// ---- ViewModel 型 ----

export interface MissedDose {
  date: string;
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  memberName: string;
  memberId: string;
  scheduledTime: string;
}

export interface StockAlert {
  medicationId: string;
  medicationName: string;
  memberId: string;
  memberName: string;
  stockQuantity: number | null;
  stockAlertDate: string;
  daysUntilAlert: number;
  isOverdue: boolean;
  remainingDays: number | null;
}

export interface MemberAdherenceStats {
  memberId: string;
  memberName: string;
  weeklyRate: number;
  monthlyRate: number;
  weeklyCount: number;
  monthlyCount: number;
}

export interface AdherenceStats {
  overall: { weeklyRate: number; monthlyRate: number; weeklyCount: number; monthlyCount: number };
  members: MemberAdherenceStats[];
}

export interface EnrichedAppointment extends Appointment {
  memberName: string | null;
  hospitalName: string | null;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * ホーム画面で必要な全データを取得し、クライアント側で集計する。
 * Go バックエンドは集計エンドポイントを持たないため、一覧 API から算出する。
 */
export function useDashboardData(userId: string | null) {
  const enabled = !!userId;

  const todayQuery = useTodaySchedules({ enabled });
  const schedulesQuery = useSchedules({ enabled });
  // ダッシュボードの集計は週次/月次のみ。全件ではなく直近40日に絞って取得する。
  // (invalidateQueries({queryKey:["records"]}) はプレフィックス一致でこのキーも無効化する)
  const recordsQuery = useRecentMedicationRecords(40, { enabled });
  const medicationsQuery = useMedications({ enabled });
  const membersQuery = useMembers({ enabled });
  const appointmentsQuery = useAppointments({ enabled });
  const hospitalsQuery = useHospitals({ enabled });

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const medications = useMemo(() => medicationsQuery.data ?? [], [medicationsQuery.data]);
  const records = useMemo(() => recordsQuery.data ?? [], [recordsQuery.data]);
  const allSchedules = useMemo(() => schedulesQuery.data ?? [], [schedulesQuery.data]);
  const appointments = useMemo(() => appointmentsQuery.data ?? [], [appointmentsQuery.data]);
  const hospitals = useMemo(() => hospitalsQuery.data ?? [], [hospitalsQuery.data]);

  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.id, m.name);
    return map;
  }, [members]);

  const todaySchedules = useMemo<TodayScheduleViewModel[]>(
    () => toTodayScheduleViewModels(todayQuery.data ?? [], new Date()),
    [todayQuery.data],
  );

  const missedDoses = useMemo<MissedDose[]>(() => {
    if (allSchedules.length === 0) return [];
    const medMap = new Map(medications.map((m) => [m.id, m]));

    const recordedKeys = new Set<string>();
    for (const r of records) {
      if (!r.scheduleId) continue;
      recordedKeys.add(`${toDateKey(new Date(r.takenAt))}-${r.scheduleId}`);
    }

    const now = new Date();
    const result: MissedDose[] = [];
    for (let offset = 1; offset <= 7; offset++) {
      const target = new Date(now);
      target.setDate(target.getDate() - offset);
      const dateKey = toDateKey(target);

      for (const s of allSchedules) {
        if (!s.isEnabled) continue;
        if (!isActiveOnDay(s, target)) continue;
        if (recordedKeys.has(`${dateKey}-${s.id}`)) continue;

        const med = medMap.get(s.medicationId);
        // 休薬中・中止の薬は飲み忘れ集計から除外する (status が active 以外)
        if (med && med.status !== "active") continue;
        result.push({
          date: dateKey,
          scheduleId: s.id,
          medicationId: s.medicationId,
          medicationName: med?.name ?? "お薬",
          memberName: memberNameMap.get(s.memberId) ?? "",
          memberId: s.memberId,
          scheduledTime: s.scheduledTime,
        });
      }
    }
    result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
    return result;
  }, [allSchedules, medications, records, memberNameMap]);

  const stockAlerts = useMemo<StockAlert[]>(() => {
    const todayKey = toDateKey(new Date());
    const alerts: StockAlert[] = [];
    for (const med of medications) {
      if (!med.isActive) continue;
      if (!med.stockAlertDate) continue;
      const alertKey = med.stockAlertDate.slice(0, 10);
      const daysUntilAlert = Math.round(
        (new Date(`${alertKey}T00:00:00`).getTime() - new Date(`${todayKey}T00:00:00`).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysUntilAlert > 7) continue;
      alerts.push({
        medicationId: med.id,
        medicationName: med.name,
        memberId: med.memberId,
        memberName: memberNameMap.get(med.memberId) ?? "",
        stockQuantity: med.stockQuantity,
        stockAlertDate: alertKey,
        daysUntilAlert: Math.max(0, daysUntilAlert),
        isOverdue: daysUntilAlert < 0,
        remainingDays: med.stockQuantity,
      });
    }
    alerts.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return a.daysUntilAlert - b.daysUntilAlert;
    });
    return alerts;
  }, [medications, memberNameMap]);

  const adherenceStats = useMemo<AdherenceStats>(() => {
    if (allSchedules.length === 0) {
      return { overall: { weeklyRate: 0, monthlyRate: 0, weeklyCount: 0, monthlyCount: 0 }, members: [] };
    }
    const now = new Date();

    const countRecordsInWindow = (memberId: string | null, days: number): number => {
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      return records.filter((r) => {
        if (memberId && r.memberId !== memberId) return false;
        const t = new Date(r.takenAt).getTime();
        return t >= start.getTime() && t <= now.getTime();
      }).length;
    };

    const schedulesFor = (memberId: string | null) =>
      allSchedules
        .filter((s) => s.isEnabled && (!memberId || s.memberId === memberId))
        .map((s) => ({ daysOfWeek: normalizeDays(s.daysOfWeek) }));

    const overallWeeklyExpected = calculateWeeklyExpected(schedulesFor(null));
    const overallMonthlyExpected = calculateMonthlyExpected(schedulesFor(null));

    const memberStats = members
      .map((m): MemberAdherenceStats | null => {
        const weeklyExpected = calculateWeeklyExpected(schedulesFor(m.id));
        if (weeklyExpected === 0) return null;
        const monthlyExpected = calculateMonthlyExpected(schedulesFor(m.id));
        const weeklyCount = countRecordsInWindow(m.id, 7);
        const monthlyCount = countRecordsInWindow(m.id, 30);
        return {
          memberId: m.id,
          memberName: m.name,
          weeklyRate: calculateRate(weeklyCount, weeklyExpected),
          monthlyRate: calculateRate(monthlyCount, monthlyExpected),
          weeklyCount,
          monthlyCount,
        };
      })
      .filter((s): s is MemberAdherenceStats => s !== null);

    const overallWeeklyCount = countRecordsInWindow(null, 7);
    const overallMonthlyCount = countRecordsInWindow(null, 30);

    return {
      overall: {
        weeklyRate: calculateRate(overallWeeklyCount, overallWeeklyExpected),
        monthlyRate: calculateRate(overallMonthlyCount, overallMonthlyExpected),
        weeklyCount: overallWeeklyCount,
        monthlyCount: overallMonthlyCount,
      },
      members: memberStats,
    };
  }, [allSchedules, records, members]);

  const enrichedAppointments = useMemo<EnrichedAppointment[]>(() => {
    const hospitalMap = new Map(hospitals.map((h) => [h.id, h.name]));
    return appointments.map((a) => ({
      ...a,
      memberName: memberNameMap.get(a.memberId) ?? null,
      hospitalName: a.hospitalId ? hospitalMap.get(a.hospitalId) ?? null : null,
    }));
  }, [appointments, hospitals, memberNameMap]);

  return {
    todaySchedules,
    todayLoading: todayQuery.isLoading,
    missedDoses,
    missedLoading: schedulesQuery.isLoading || recordsQuery.isLoading || medicationsQuery.isLoading,
    stockAlerts,
    stockLoading: medicationsQuery.isLoading,
    adherenceStats,
    adherenceLoading: schedulesQuery.isLoading || recordsQuery.isLoading,
    appointments: enrichedAppointments,
    appointmentsLoading: appointmentsQuery.isLoading,
    members,
  };
}
