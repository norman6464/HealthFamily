import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { TodayScheduleViewModel } from '../../domain/usecases/GetTodaySchedules';

interface WeeklySummaryCardProps {
  schedules: TodayScheduleViewModel[];
  isLoading: boolean;
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ schedules, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
        <p className="text-gray-400 text-sm text-center py-2">読み込み中...</p>
      </div>
    );
  }

  const completed = schedules.filter((s) => s.status === 'completed').length;
  const pending = schedules.filter((s) => s.status === 'pending').length;
  const overdue = schedules.filter((s) => s.status === 'overdue').length;
  const total = schedules.length;

  if (total === 0) return null;

  const completionRate = Math.round((completed / total) * 100);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">今日のまとめ</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <CheckCircle2 size={16} className="text-green-500" />
          <span className="text-sm text-gray-700">{completed}件完了</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock size={16} className="text-yellow-500" />
          <span className="text-sm text-gray-700">{pending}件予定</span>
        </div>
        {overdue > 0 && (
          <div className="flex items-center space-x-1">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm text-gray-700">{overdue}件超過</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>達成率</span>
          <span>{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${completionRate}%`,
              backgroundColor: completionRate >= 80 ? '#22c55e' : completionRate >= 50 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
      </div>
    </div>
  );
};
