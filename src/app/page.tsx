'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTodaySchedules } from '@/presentation/hooks/useTodaySchedules';
import { useAppointments } from '@/presentation/hooks/useAppointments';
import { useAdherenceStats } from '@/presentation/hooks/useAdherenceStats';
import { useStockAlerts } from '@/presentation/hooks/useStockAlerts';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useCharacterStore } from '@/stores/characterStore';
import { TodayScheduleList } from '@/components/dashboard/TodayScheduleList';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { AdherenceStatsCard } from '@/components/dashboard/AdherenceStatsCard';
import { StockAlertList } from '@/components/dashboard/StockAlertList';
import { MemberFilter } from '@/components/shared/MemberFilter';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { CharacterIcon } from '@/components/shared/CharacterIcon';

export default function Dashboard() {
  const { userId } = useAuth();
  const { schedules, isLoading, markAsCompleted } = useTodaySchedules(userId);
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { stats, isLoading: statsLoading } = useAdherenceStats();
  const { alerts, isLoading: alertsLoading } = useStockAlerts();
  const { members } = useMembers(userId);
  const { getConfig, getMessage } = useCharacterStore();
  const characterConfig = getConfig();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const filteredSchedules = useMemo(
    () => selectedMemberId ? schedules.filter((s) => s.memberId === selectedMemberId) : schedules,
    [schedules, selectedMemberId],
  );

  const memberOptions = useMemo(
    () => members.map((m) => ({ id: m.id, name: m.name })),
    [members],
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-primary-600">HealthFamily</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <div className="bg-primary-50 rounded-lg p-4 mb-6 flex items-center space-x-3">
          <CharacterIcon type={characterConfig.type} size={40} />
          <div>
            <p className="text-sm font-medium text-primary-800">{characterConfig.name}</p>
            <p className="text-sm text-primary-700">{getMessage('medicationReminder')}</p>
          </div>
        </div>

        <AdherenceStatsCard stats={stats} isLoading={statsLoading} />

        <StockAlertList alerts={alerts} isLoading={alertsLoading} />

        <UpcomingAppointments
          appointments={appointments}
          isLoading={appointmentsLoading}
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
        />
      </main>

      <BottomNavigation activePath="/" />
    </div>
  );
}
