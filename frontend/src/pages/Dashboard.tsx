import { useState, useEffect } from 'react';
import { TodayScheduleList } from '../components/dashboard/TodayScheduleList';
import { TodayScheduleItem } from '../types/dashboard';

// モックデータ（後でAPI連携に置き換え）
const mockSchedules: TodayScheduleItem[] = [
  {
    scheduleId: '1',
    medicationId: 'med-1',
    medicationName: '血圧の薬',
    userId: 'user-1',
    memberId: 'member-1',
    memberName: 'パパ',
    memberType: 'human',
    scheduledTime: '08:00',
    status: 'completed',
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
    isEnabled: true,
    reminderMinutesBefore: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    scheduleId: '2',
    medicationId: 'med-2',
    medicationName: '胃薬',
    userId: 'user-1',
    memberId: 'member-2',
    memberName: 'ママ',
    memberType: 'human',
    scheduledTime: '12:00',
    status: 'pending',
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    isEnabled: true,
    reminderMinutesBefore: 30,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    scheduleId: '3',
    medicationId: 'med-3',
    medicationName: 'フィラリア薬',
    userId: 'user-1',
    memberId: 'member-3',
    memberName: 'ポチ',
    memberType: 'pet',
    scheduledTime: '18:00',
    status: 'pending',
    daysOfWeek: ['mon', 'wed', 'fri'],
    isEnabled: true,
    reminderMinutesBefore: 15,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

export default function Dashboard() {
  const [schedules, setSchedules] = useState<TodayScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // モックデータをロード（後でAPI呼び出しに置き換え）
    const loadSchedules = async () => {
      setIsLoading(true);
      // 実際のAPI呼び出しをシミュレート
      await new Promise(resolve => setTimeout(resolve, 500));
      setSchedules(mockSchedules);
      setIsLoading(false);
    };

    loadSchedules();
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-primary-700">HealthFamily</h1>
      </header>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 text-center">
        <div className="text-4xl mb-2">🐈️</div>
        <p className="text-lg font-medium text-gray-700">
          お薬の時間だにゃい！
        </p>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">今日の予定</h2>
        <div className="bg-white rounded-xl shadow-sm">
          <TodayScheduleList schedules={schedules} isLoading={isLoading} />
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <button className="flex flex-col items-center text-primary-600 text-xs">
            <span className="text-lg">🏠</span>
            ホーム
          </button>
          <button className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">💊</span>
            お薬
          </button>
          <button className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">📅</span>
            通院
          </button>
          <button className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">👤</span>
            設定
          </button>
        </div>
      </nav>
    </div>
  );
}
