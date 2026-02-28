'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTodaySchedules } from '@/presentation/hooks/useTodaySchedules';
import { useCharacterStore } from '@/stores/characterStore';
import { TodayScheduleList } from '@/components/dashboard/TodayScheduleList';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { CharacterIcon } from '@/components/shared/CharacterIcon';

export default function Dashboard() {
  const { userId } = useAuth();
  const { schedules, isLoading, markAsCompleted } = useTodaySchedules(userId);
  const { getConfig, getMessage } = useCharacterStore();
  const characterConfig = getConfig();

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

        <h2 className="text-lg font-semibold text-gray-800 mb-4">今日の予定</h2>
        <TodayScheduleList
          schedules={schedules}
          isLoading={isLoading}
          onMarkCompleted={markAsCompleted}
        />
      </main>

      <BottomNavigation activePath="/" />
    </div>
  );
}
