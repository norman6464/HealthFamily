import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { StreakInfo } from '@/domain/entities/AdherenceStats';

interface StreakCardProps {
  streak: StreakInfo | null;
  isLoading: boolean;
}

export const StreakCard: React.FC<StreakCardProps> = React.memo(({ streak, isLoading }) => {
  if (isLoading || !streak) return null;

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
              <Flame size={20} className="text-orange-500" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold text-gray-900">{streak.current}</span>
                <span className="text-sm text-gray-500">日連続</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{streak.message}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-gray-400">
              <Trophy size={14} />
              <span className="text-xs">最長記録</span>
            </div>
            <span className="text-lg font-semibold text-gray-700">{streak.longest}</span>
            <span className="text-xs text-gray-400 ml-0.5">日</span>
          </div>
        </div>
      </div>
    </div>
  );
});

StreakCard.displayName = 'StreakCard';
