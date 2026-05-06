'use client';

import { useCallback, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTodaySchedules } from '@/presentation/hooks/useTodaySchedules';
import { useAppointments } from '@/presentation/hooks/useAppointments';
import { useAdherenceStats } from '@/presentation/hooks/useAdherenceStats';
import { useStockAlerts } from '@/presentation/hooks/useStockAlerts';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useUserProfile } from '@/presentation/hooks/useUserProfile';
import { useMissedDoses, MissedDose } from '@/presentation/hooks/useMissedDoses';
import { useMedicationRecordActions } from '@/presentation/hooks/useMedicationRecordActions';
import { TodayScheduleList } from '@/components/dashboard/TodayScheduleList';
import { MissedDosesAlert } from '@/components/dashboard/MissedDosesAlert';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { AdherenceStatsCard } from '@/components/dashboard/AdherenceStatsCard';
import { StockAlertList } from '@/components/dashboard/StockAlertList';
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard';
import { GreetingCard } from '@/components/dashboard/GreetingCard';
import { MemberFilter } from '@/components/shared/MemberFilter';
import { BottomNavigation } from '@/components/shared/BottomNavigation';

function buildTakenAtISO(date: string, scheduledTime: string): string {
  return new Date(`${date}T${scheduledTime}:00+09:00`).toISOString();
}

export default function Dashboard() {
  const { userId } = useAuth();
  const { schedules, isLoading, markAsCompleted, markMultipleCompleted, refetch: refetchToday } = useTodaySchedules(userId);
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useAdherenceStats();
  const { alerts, isLoading: alertsLoading } = useStockAlerts();
  const { members } = useMembers(userId);
  const { profile } = useUserProfile();
  const { missedDoses, isLoading: missedLoading, refetch: refetchMissed } = useMissedDoses();
  const { markScheduleAsTakenAt } = useMedicationRecordActions();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleMarkMissedAsTaken = useCallback(async (dose: MissedDose) => {
    const takenAt = buildTakenAtISO(dose.date, dose.scheduledTime);
    await markScheduleAsTakenAt(dose.memberId, dose.medicationId, dose.scheduleId, takenAt);
    await Promise.all([refetchMissed(), refetchToday(), refetchStats()]);
  }, [markScheduleAsTakenAt, refetchMissed, refetchToday, refetchStats]);

  const handleMarkMultipleMissedAsTaken = useCallback(async (doses: MissedDose[]) => {
    let failed = 0;
    for (const dose of doses) {
      try {
        const takenAt = buildTakenAtISO(dose.date, dose.scheduledTime);
        await markScheduleAsTakenAt(dose.memberId, dose.medicationId, dose.scheduleId, takenAt);
      } catch {
        failed++;
      }
    }
    await Promise.all([refetchMissed(), refetchToday(), refetchStats()]);
    if (failed > 0) {
      throw new Error(`${failed}件の記録に失敗しました`);
    }
  }, [markScheduleAsTakenAt, refetchMissed, refetchToday, refetchStats]);

  const filteredSchedules = useMemo(
    () => selectedMemberId ? schedules.filter((s) => s.memberId === selectedMemberId) : schedules,
    [schedules, selectedMemberId],
  );

  const memberOptions = useMemo(
    () => members.map((m) => ({ id: m.id, name: m.name })),
    [members],
  );

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-header shadow-soft">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-white tracking-wide">HealthFamily</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <GreetingCard displayName={profile?.displayName || ''} weeklyRate={stats?.overall.weeklyRate} />

        <WeeklySummaryCard schedules={schedules} isLoading={isLoading} />

        <MissedDosesAlert
          missedDoses={missedDoses}
          isLoading={missedLoading}
          onMarkAsTaken={handleMarkMissedAsTaken}
          onMarkMultipleAsTaken={handleMarkMultipleMissedAsTaken}
        />

        <h2 className="text-lg font-semibold text-gray-800 mb-3">今日の予定</h2>
        <div className="mb-4">
          <MemberFilter
            members={memberOptions}
            selectedMemberId={selectedMemberId}
            onSelect={setSelectedMemberId}
          />
        </div>
        <TodayScheduleList
          schedules={filteredSchedules}
          isLoading={isLoading}
          onMarkCompleted={markAsCompleted}
          onMarkMultipleCompleted={markMultipleCompleted}
          hasMembers={members.length > 0}
        />

        <StockAlertList alerts={alerts} isLoading={alertsLoading} />

        <AdherenceStatsCard stats={stats} isLoading={statsLoading} />

        <UpcomingAppointments
          appointments={appointments}
          isLoading={appointmentsLoading}
        />
      </main>

      <BottomNavigation activePath="/" />
    </div>
  );
}
