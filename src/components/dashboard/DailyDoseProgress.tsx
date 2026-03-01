import React from 'react';
import { Pill } from 'lucide-react';

interface DailyDoseProgressProps {
  taken: number;
  total: number;
}

export const DailyDoseProgress: React.FC<DailyDoseProgressProps> = ({ taken, total }) => {
  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-4">
        <div className="flex items-center space-x-2 text-gray-400">
          <Pill size={18} />
          <span className="text-sm">今日の予定なし</span>
        </div>
      </div>
    );
  }

  const percentage = Math.round((taken / total) * 100);
  const isComplete = taken >= total;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Pill size={18} className="text-primary-600" />
          <span className="text-sm font-medium text-gray-700">今日の服薬</span>
        </div>
        <div className="text-sm font-semibold">
          {isComplete ? (
            <span className="text-green-600">全て完了</span>
          ) : (
            <span className="text-gray-700">{taken} / {total}</span>
          )}
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full bg-gray-200 rounded-full h-2"
      >
        <div
          className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
