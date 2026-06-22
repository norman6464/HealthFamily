import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Appointment,
  Hospital,
  Medication,
  MedicationRecord,
  Member,
  Schedule,
  TodaySchedule,
} from "@/lib/types";

// ---- ドメインロジック (旧 domain/entities から忠実移植) ----

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type ScheduleStatus = "pending" | "completed" | "overdue";
export type OverdueLevel = "none" | "warning" | "danger";

const VALID_DAYS: readonly DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_MAP: Record<number, DayOfWeek> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

const PROXIMITY_SOON_MINUTES = 30;
const PROXIMITY_NEAR_MINUTES = 60;

function normalizeDays(days: string[] | null | undefined): DayOfWeek[] {
  if (!days) return [];
  return days.filter((d): d is DayOfWeek => VALID_DAYS.includes(d as DayOfWeek));
}

function getScheduledDateTime(scheduledTime: string, baseTime: Date): Date {
  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const dt = new Date(baseTime);
  dt.setHours(hours, minutes, 0, 0);
  return dt;
}

export function getScheduleStatus(scheduledTime: string, currentTime: Date, isCompleted: boolean): ScheduleStatus {
  if (isCompleted) return "completed";
  const scheduledDateTime = getScheduledDateTime(scheduledTime, currentTime);
  if (currentTime > scheduledDateTime) return "overdue";
  return "pending";
}

export function getOverdueLevel(scheduledTime: string, currentTime: Date, isCompleted: boolean): OverdueLevel {
  if (isCompleted) return "none";
  const scheduledDateTime = getScheduledDateTime(scheduledTime, currentTime);
  const diffMs = currentTime.getTime() - scheduledDateTime.getTime();
  if (diffMs <= 0) return "none";
  const diffMinutes = diffMs / (1000 * 60);
  if (diffMinutes >= PROXIMITY_NEAR_MINUTES) return "danger";
  if (diffMinutes >= PROXIMITY_SOON_MINUTES) return "warning";
  return "none";
}

export function getOverdueMinutes(scheduledTime: string, currentTime: Date): number {
  const scheduledDateTime = getScheduledDateTime(scheduledTime, currentTime);
  const diffMs = currentTime.getTime() - scheduledDateTime.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60));
}

export function getOverdueLevelStyle(level: OverdueLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case "danger":
      return { bg: "bg-red-50", text: "text-red-600", border: "border-red-300" };
    case "warning":
      return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-300" };
    default:
      return { bg: "", text: "", border: "" };
  }
}

interface ScheduleLike {
  daysOfWeek: string[] | null;
  intervalDays: number | null;
  startDate: string | null;
  isEnabled: boolean;
}

function isActiveOnDay(s: ScheduleLike, scheduledTime: string, date: Date): boolean {
  if (!s.isEnabled) return false;
  if (s.intervalDays === -1) return false;
  if (s.intervalDays && s.intervalDays > 0 && s.startDate) {
    const start = new Date(s.startDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return false;
    return diffDays % s.intervalDays === 0;
  }
  const days = normalizeDays(s.daysOfWeek);
  if (days.length === 0) return true;
  return days.includes(DAY_MAP[date.getDay()]);
}

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

export interface TodayScheduleViewModel {
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  userId: string;
  memberId: string;
  memberName: string;
  memberType: "human" | "pet";
  scheduledTime: string;
  medicationDisplayOrder: number;
  status: ScheduleStatus;
  isEnabled: boolean;
  reminderMinutesBefore: number;
}

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

  const todayQuery = useQuery({
    queryKey: ["schedules", "today"],
    queryFn: () => api.get<TodaySchedule[]>("/schedules/today"),
    enabled,
  });
  const schedulesQuery = useQuery({
    queryKey: ["schedules"],
    queryFn: () => api.get<Schedule[]>("/schedules"),
    enabled,
  });
  // ダッシュボードの集計は週次/月次のみ。全件ではなく直近40日に絞って取得する。
  // (invalidateQueries({queryKey:["records"]}) はプレフィックス一致でこのキーも無効化する)
  const recordsQuery = useQuery({
    queryKey: ["records", "window", 40],
    queryFn: () => api.get<MedicationRecord[]>("/records?days=40"),
    enabled,
  });
  const medicationsQuery = useQuery({
    queryKey: ["medications"],
    queryFn: () => api.get<Medication[]>("/medications"),
    enabled,
  });
  const membersQuery = useQuery({
    queryKey: ["members"],
    queryFn: () => api.get<Member[]>("/members"),
    enabled,
  });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: () => api.get<Appointment[]>("/appointments"),
    enabled,
  });
  const hospitalsQuery = useQuery({
    queryKey: ["hospitals"],
    queryFn: () => api.get<Hospital[]>("/hospitals"),
    enabled,
  });

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

  const todaySchedules = useMemo<TodayScheduleViewModel[]>(() => {
    const now = new Date();
    const items = (todayQuery.data ?? []).map((item): TodayScheduleViewModel => ({
      scheduleId: item.id,
      medicationId: item.medicationId,
      medicationName: item.medicationName,
      userId: item.userId,
      memberId: item.memberId,
      memberName: item.memberName,
      memberType: item.memberType === "pet" ? "pet" : "human",
      scheduledTime: item.scheduledTime,
      medicationDisplayOrder: item.medicationDisplayOrder ?? 0,
      status: getScheduleStatus(item.scheduledTime, now, item.isCompleted),
      isEnabled: item.isEnabled,
      reminderMinutesBefore: item.reminderMinutesBefore ?? 10,
    }));
    items.sort((a, b) => {
      const timeCompare = a.scheduledTime.localeCompare(b.scheduledTime);
      if (timeCompare !== 0) return timeCompare;
      const memberCompare = a.memberName.localeCompare(b.memberName);
      if (memberCompare !== 0) return memberCompare;
      return a.medicationDisplayOrder - b.medicationDisplayOrder;
    });
    return items;
  }, [todayQuery.data]);

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
        if (!isActiveOnDay(s, s.scheduledTime, target)) continue;
        if (recordedKeys.has(`${dateKey}-${s.id}`)) continue;

        const med = medMap.get(s.medicationId);
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

export interface MarkRecordInput {
  memberId: string;
  medicationId: string;
  scheduleId: string;
  takenAt?: string;
  notes?: string;
}

/**
 * 服薬記録を作成し、関連クエリを無効化する。
 */
export function useMarkRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkRecordInput) =>
      api.post<MedicationRecord>("/records", {
        memberId: input.memberId,
        medicationId: input.medicationId,
        scheduleId: input.scheduleId,
        ...(input.takenAt ? { takenAt: input.takenAt } : {}),
        ...(input.notes ? { notes: input.notes } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules", "today"] });
      qc.invalidateQueries({ queryKey: ["records"] });
    },
  });
}
