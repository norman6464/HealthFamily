'use client';

type Level = 'excellent' | 'good' | 'warning' | 'critical';

interface StatisticsBadgeProps {
  label: string;
  value: number | string;
  unit?: string;
  level?: Level;
}

const levelStyles: Record<Level, string> = {
  excellent: 'bg-blue-50 text-blue-700',
  good: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  critical: 'bg-red-50 text-red-700',
};

export function StatisticsBadge({
  label,
  value,
  unit,
  level = 'good',
}: StatisticsBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${levelStyles[level]}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-lg font-bold">
        {value}
        {unit && <span className="ml-0.5 text-sm">{unit}</span>}
      </span>
    </div>
  );
}
