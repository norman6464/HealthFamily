import React from 'react';
import { Activity } from 'lucide-react';

interface DailyAverage {
  date: string;
  dayLabel: string;
  average: number | null;
}

interface HealthWeeklyTrendProps {
  averages: DailyAverage[];
}

const BAR_COLORS: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-green-400',
  5: 'bg-green-500',
};

export const HealthWeeklyTrend: React.FC<HealthWeeklyTrendProps> = React.memo(({ averages }) => {
  if (averages.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <Activity size={16} className="text-primary-600" />
        <h3 className="text-sm font-semibold text-gray-700">週間体調トレンド</h3>
      </div>

      <div className="flex items-end justify-between space-x-1" style={{ height: '80px' }}>
        {averages.map((day) => (
          <div key={day.date} className="flex flex-col items-center flex-1">
            <div className="w-full flex flex-col items-center justify-end" style={{ height: '60px' }}>
              {day.average !== null ? (
                <div
                  className={`w-full max-w-[24px] rounded-t ${BAR_COLORS[day.average] ?? 'bg-gray-300'}`}
                  style={{ height: `${(day.average / 5) * 100}%` }}
                />
              ) : (
                <div className="w-full max-w-[24px] h-1 bg-gray-200 rounded" />
              )}
            </div>
            <span className="text-xs text-gray-400 mt-1">{day.dayLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

HealthWeeklyTrend.displayName = 'HealthWeeklyTrend';
