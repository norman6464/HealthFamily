import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useDashboardData, useMarkRecord, type MissedDose } from "@/hooks/dashboard";
import { GreetingCard } from "@/components/dashboard/GreetingCard";
import { WeeklySummaryCard } from "@/components/dashboard/WeeklySummaryCard";
import { MissedDosesAlert } from "@/components/dashboard/MissedDosesAlert";
import { TodayScheduleList } from "@/components/dashboard/TodayScheduleList";
import { StockAlertList } from "@/components/dashboard/StockAlertList";
import { AdherenceStatsCard } from "@/components/dashboard/AdherenceStatsCard";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { MemberFilter } from "@/components/shared/MemberFilter";
import { SectionTitle } from "@/components/shared/SectionTitle";

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

  return (
    <div className="space-y-0">
      <GreetingCard
        displayName={user?.displayName ?? ""}
        weeklyRate={adherenceStats?.overall.weeklyRate}
      />

      <WeeklySummaryCard schedules={todaySchedules} isLoading={todayLoading} />

      <MissedDosesAlert
        missedDoses={missedDoses}
        isLoading={missedLoading}
        onMarkAsTaken={handleMarkMissedAsTaken}
        onMarkMultipleAsTaken={handleMarkMultipleMissedAsTaken}
      />

      <SectionTitle accentColor="pink" size="lg">
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

      <div className="mt-6">
        <StockAlertList alerts={stockAlerts} isLoading={stockLoading} />

        <AdherenceStatsCard stats={adherenceStats} isLoading={adherenceLoading} />

        <UpcomingAppointments appointments={appointments} isLoading={appointmentsLoading} />
      </div>
    </div>
  );
}
