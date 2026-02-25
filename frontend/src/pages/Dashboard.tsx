import { TodayScheduleList } from '../components/dashboard/TodayScheduleList';
import { BottomNavigation } from '../components/shared/BottomNavigation';
import { useTodaySchedules } from '../presentation/hooks/useTodaySchedules';
import { useCharacterStore } from '../stores/characterStore';

export default function Dashboard() {
  const { schedules, isLoading, markAsCompleted } = useTodaySchedules('user-1'); // TODO: 実際のuserIdに置き換え
  const { getConfig, getMessage } = useCharacterStore();
  const character = getConfig();

  const handleMarkCompleted = async (scheduleId: string) => {
    await markAsCompleted(scheduleId);
  };

  return (
    <>
      <main className="max-w-md mx-auto p-4 pb-20">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-primary-700">HealthFamily</h1>
        </header>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 text-center" role="status" aria-live="polite">
          <div className="text-4xl mb-2" role="img" aria-label={`${character.name}キャラクター`}>{character.icon}</div>
          <p className="text-lg font-medium text-gray-700">
            {getMessage('medicationReminder')}
          </p>
        </div>

        <section className="mb-6" aria-labelledby="today-schedule-heading">
          <h2 id="today-schedule-heading" className="text-sm font-semibold text-gray-500 mb-3">今日の予定</h2>
          <div className="bg-white rounded-xl shadow-sm">
            <TodayScheduleList schedules={schedules} isLoading={isLoading} onMarkCompleted={handleMarkCompleted} />
          </div>
        </section>
      </main>

      <BottomNavigation activePath="/" />
    </>
  );
}
