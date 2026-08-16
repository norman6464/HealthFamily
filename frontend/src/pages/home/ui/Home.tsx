import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { api } from "@/shared/api";
import { queryKeys } from "@/shared/api";
import type { DashboardPreference } from "@/shared/api";
import { useAuth } from "@/features/auth";
import { useDashboardData, useMarkRecord, type MissedDose } from "../model/dashboard";
import { GreetingCard } from "./GreetingCard";
import { WeeklySummaryCard } from "./WeeklySummaryCard";
import { MissedDosesAlert } from "./MissedDosesAlert";
import { TodayScheduleList } from "./TodayScheduleList";
import { StockAlertList } from "./StockAlertList";
import { AdherenceStatsCard } from "./AdherenceStatsCard";
import { UpcomingAppointments } from "./UpcomingAppointments";
import {
  DashboardSettings,
  ORDERABLE_CARD_KEYS,
  type DashboardCardKey,
} from "./DashboardSettings";
import { MemberFilter } from "@/shared/ui";
import { SectionTitle } from "@/shared/ui";

const EMPTY_PREFERENCE: DashboardPreference = {
  userId: "",
  hiddenCards: [],
  cardOrder: [],
  defaultMemberId: null,
};

// 保存済み cardOrder を並び替え対象キーの確定順序に解決する。
function resolveCardOrder(savedOrder: string[]): DashboardCardKey[] {
  const orderable = new Set<DashboardCardKey>(ORDERABLE_CARD_KEYS);
  const result: DashboardCardKey[] = [];
  for (const key of savedOrder) {
    const k = key as DashboardCardKey;
    if (orderable.has(k) && !result.includes(k)) result.push(k);
  }
  for (const key of ORDERABLE_CARD_KEYS) {
    if (!result.includes(key)) result.push(key);
  }
  return result;
}

function buildTakenAtISO(date: string, scheduledTime: string): string {
  return new Date(`${date}T${scheduledTime}:00+09:00`).toISOString();
}

export default function Home() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const {
    todaySchedules,
    todayLoading,
    missedDoses,
    missedLoading,
    stockAlerts,
    stockLoading,
    adherenceStats,
    adherenceLoading,
    appointments,
    appointmentsLoading,
    members,
  } = useDashboardData(userId);

  const markRecord = useMarkRecord();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // defaultMemberId の初期反映は一度だけ行い、以降のユーザー操作を上書きしない
  const [defaultApplied, setDefaultApplied] = useState(false);

  const { data: preference = EMPTY_PREFERENCE } = useQuery({
    queryKey: queryKeys.dashboardPreferences.all,
    queryFn: () => api.get<DashboardPreference>("/dashboard-preferences"),
    enabled: !!userId,
  });

  const hiddenCards = useMemo(
    () => new Set(preference.hiddenCards),
    [preference.hiddenCards],
  );
  const cardOrder = useMemo(
    () => resolveCardOrder(preference.cardOrder),
    [preference.cardOrder],
  );

  useEffect(() => {
    if (defaultApplied) return;
    if (preference.defaultMemberId) {
      setSelectedMemberId(preference.defaultMemberId);
    }
    setDefaultApplied(true);
  }, [preference.defaultMemberId, defaultApplied]);

  const handleMarkCompleted = useCallback(
    async (scheduleId: string, options?: { takenAt?: string; notes?: string }) => {
      const target = todaySchedules.find((s) => s.scheduleId === scheduleId);
      if (!target) return;
      await markRecord.mutateAsync({
        memberId: target.memberId,
        medicationId: target.medicationId,
        scheduleId: target.scheduleId,
        takenAt: options?.takenAt,
        notes: options?.notes,
      });
    },
    [todaySchedules, markRecord],
  );

  const handleMarkMultipleCompleted = useCallback(
    async (scheduleIds: string[]) => {
      let failed = 0;
      for (const scheduleId of scheduleIds) {
        try {
          await handleMarkCompleted(scheduleId);
        } catch {
          failed++;
        }
      }
      if (failed > 0) {
        throw new Error(`${failed}件の記録に失敗しました`);
      }
    },
    [handleMarkCompleted],
  );

  const handleMarkMissedAsTaken = useCallback(
    async (dose: MissedDose) => {
      const takenAt = buildTakenAtISO(dose.date, dose.scheduledTime);
      await markRecord.mutateAsync({
        memberId: dose.memberId,
        medicationId: dose.medicationId,
        scheduleId: dose.scheduleId,
        takenAt,
      });
    },
    [markRecord],
  );

  const handleMarkMultipleMissedAsTaken = useCallback(
    async (doses: MissedDose[]) => {
      let failed = 0;
      for (const dose of doses) {
        try {
          await handleMarkMissedAsTaken(dose);
        } catch {
          failed++;
        }
      }
      if (failed > 0) {
        throw new Error(`${failed}件の記録に失敗しました`);
      }
    },
    [handleMarkMissedAsTaken],
  );

  const filteredSchedules = useMemo(
    () =>
      selectedMemberId
        ? todaySchedules.filter((s) => s.memberId === selectedMemberId)
        : todaySchedules,
    [todaySchedules, selectedMemberId],
  );

  const memberOptions = useMemo(
    () => members.map((m) => ({ id: m.id, name: m.name })),
    [members],
  );

  const bottomCards: Record<DashboardCardKey, ReactNode> = {
    weeklySummary: <></>,
    missedDoses: <></>,
    todaySchedule: <></>,
    stockAlerts: <StockAlertList alerts={stockAlerts} isLoading={stockLoading} />,
    adherence: <AdherenceStatsCard stats={adherenceStats} isLoading={adherenceLoading} />,
    upcomingAppointments: (
      <UpcomingAppointments appointments={appointments} isLoading={appointmentsLoading} />
    ),
  };

  return (
    <div className="space-y-0">
      <div className="mb-3 flex items-center justify-end">
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
          aria-expanded={showSettings}
        >
          <SlidersHorizontal size={16} />
          表示設定
        </button>
      </div>

      {showSettings && (
        <div className="mb-4">
          <DashboardSettings
            preference={preference}
            members={members}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}

      <GreetingCard
        displayName={user?.displayName ?? ""}
        weeklyRate={adherenceStats?.overall.weeklyRate}
      />

      {!hiddenCards.has("weeklySummary") && (
        <WeeklySummaryCard schedules={todaySchedules} isLoading={todayLoading} />
      )}

      {!hiddenCards.has("missedDoses") && (
        <MissedDosesAlert
          missedDoses={missedDoses}
          isLoading={missedLoading}
          onMarkAsTaken={handleMarkMissedAsTaken}
          onMarkMultipleAsTaken={handleMarkMultipleMissedAsTaken}
        />
      )}

      {!hiddenCards.has("todaySchedule") && (
        <>
          <SectionTitle accentColor="primary" size="lg">
            今日の予定
          </SectionTitle>
          <div className="mb-4">
            <MemberFilter
              members={memberOptions}
              selectedMemberId={selectedMemberId}
              onSelect={setSelectedMemberId}
            />
          </div>
          <TodayScheduleList
            schedules={filteredSchedules}
            isLoading={todayLoading}
            onMarkCompleted={handleMarkCompleted}
            onMarkMultipleCompleted={handleMarkMultipleCompleted}
            hasMembers={members.length > 0}
          />
        </>
      )}

      <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
        {cardOrder
          .filter((key) => !hiddenCards.has(key))
          .map((key) => (
            <div key={key}>{bottomCards[key]}</div>
          ))}
      </div>
    </div>
  );
}
