import React from "react";
import { TrendingUp } from "lucide-react";
import { getRateLabel, getRateLevel, type AdherenceStats } from "../model/dashboard";

interface AdherenceStatsCardProps {
  stats: AdherenceStats | null;
  isLoading: boolean;
}

const levelColors = {
  excellent: "text-green-600",
  good: "text-blue-600",
  warning: "text-yellow-600",
  poor: "text-red-600",
} as const;

const levelBgColors = {
  excellent: "bg-green-100",
  good: "bg-blue-100",
  warning: "bg-yellow-100",
  poor: "bg-red-100",
} as const;

export const AdherenceStatsCard: React.FC<AdherenceStatsCardProps> = React.memo(
  ({ stats, isLoading }) => {
    if (isLoading || !stats) return null;

    const weeklyLevel = getRateLevel(stats.overall.weeklyRate);
    const monthlyLevel = getRateLevel(stats.overall.monthlyRate);

    return (
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-ink-800">お薬の達成率</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 border border-primary-100">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-ink-500 mb-1">週間</p>
              <p className={`text-2xl font-bold ${levelColors[weeklyLevel]}`}>
                {stats.overall.weeklyRate}%
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${levelBgColors[weeklyLevel]} ${levelColors[weeklyLevel]}`}
              >
                {getRateLabel(stats.overall.weeklyRate)}
              </span>
            </div>
            <div className="text-center">
              <p className="text-xs text-ink-500 mb-1">月間</p>
              <p className={`text-2xl font-bold ${levelColors[monthlyLevel]}`}>
                {stats.overall.monthlyRate}%
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${levelBgColors[monthlyLevel]} ${levelColors[monthlyLevel]}`}
              >
                {getRateLabel(stats.overall.monthlyRate)}
              </span>
            </div>
          </div>

          {stats.members.length > 0 && (
            <div className="border-t border-primary-100 pt-3">
              <p className="text-xs text-ink-500 mb-2">メンバー別</p>
              <div className="space-y-2">
                {stats.members.map((member) => {
                  const memberLevel = getRateLevel(member.weeklyRate);
                  return (
                    <div key={member.memberId} className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">{member.memberName}</span>
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
  },
);

AdherenceStatsCard.displayName = "AdherenceStatsCard";
