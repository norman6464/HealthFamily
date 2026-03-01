import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AdherenceTrend, AdherenceTrendEntity } from '../../domain/entities/AdherenceTrend';

interface AdherenceTrendCardProps {
  trend: AdherenceTrend | null;
  isLoading: boolean;
}

export const AdherenceTrendCard: React.FC<AdherenceTrendCardProps> = ({ trend, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
        <p className="text-gray-400 text-sm text-center py-2">読み込み中...</p>
      </div>
    );
  }

  if (!trend) return null;

  const entity = new AdherenceTrendEntity(trend);
  const TrendIcon = entity.isImproving() ? TrendingUp : entity.isDeclining() ? TrendingDown : Minus;
  const trendColor = entity.isImproving() ? 'text-green-600' : entity.isDeclining() ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">服薬トレンド（週間）</h3>
        <div className={`flex items-center space-x-1 ${trendColor}`}>
          <TrendIcon size={16} />
          <span className="text-sm font-medium">{entity.getRateChangeLabel()}</span>
        </div>
      </div>

      <div className="flex justify-between mb-2">
        {trend.dayOfWeekStats.map((stat) => (
          <div key={stat.day} className="flex flex-col items-center">
            <div
              className="w-6 rounded-t"
              style={{
                height: `${Math.max(4, stat.rate * 0.4)}px`,
                backgroundColor: stat.rate >= 80 ? '#22c55e' : stat.rate >= 50 ? '#f59e0b' : '#ef4444',
              }}
            />
            <span className="text-xs text-gray-500 mt-1">{stat.dayLabel}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>最高: {trend.bestDay}曜日</span>
        <span>最低: {trend.worstDay}曜日</span>
      </div>
    </div>
  );
};
