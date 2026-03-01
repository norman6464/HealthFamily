import React from 'react';
import { TrendingUp } from 'lucide-react';
import { AdherenceStats, AdherenceStatsEntity } from '../../domain/entities/AdherenceStats';

interface AdherenceStatsCardProps {
  stats: AdherenceStats | null;
  isLoading: boolean;
}

const levelColors = {
  excellent: 'text-green-600',
  good: 'text-blue-600',
  warning: 'text-yellow-600',
  poor: 'text-red-600',
} as const;

const levelBgColors = {
  excellent: 'bg-green-100',
  good: 'bg-blue-100',
  warning: 'bg-yellow-100',
  poor: 'bg-red-100',
} as const;

export const AdherenceStatsCard: React.FC<AdherenceStatsCardProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) return null;

  const weeklyLevel = AdherenceStatsEntity.getRateLevel(stats.overall.weeklyRate);
  const monthlyLevel = AdherenceStatsEntity.getRateLevel(stats.overall.monthlyRate);

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <TrendingUp size={18} className="text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-800">服薬アドヒアランス</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">週間</p>
            <p className={`text-2xl font-bold ${levelColors[weeklyLevel]}`}>
              {stats.overall.weeklyRate}%
            </p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${levelBgColors[weeklyLevel]} ${levelColors[weeklyLevel]}`}>
              {AdherenceStatsEntity.getRateLabel(stats.overall.weeklyRate)}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">月間</p>
            <p className={`text-2xl font-bold ${levelColors[monthlyLevel]}`}>
              {stats.overall.monthlyRate}%
            </p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${levelBgColors[monthlyLevel]} ${levelColors[monthlyLevel]}`}>
              {AdherenceStatsEntity.getRateLabel(stats.overall.monthlyRate)}
            </span>
          </div>
        </div>

        {stats.members.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-2">メンバー別</p>
            <div className="space-y-2">
              {stats.members.map((member) => {
                const memberLevel = AdherenceStatsEntity.getRateLevel(member.weeklyRate);
                return (
                  <div key={member.memberId} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{member.memberName}</span>
                    <span className={`text-sm font-medium ${levelColors[memberLevel]}`}>
                      {member.weeklyRate}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
