import React from 'react';

interface AdherenceProgressRingProps {
  percentage: number;
  label: string;
  size?: number;
}

export const AdherenceProgressRing: React.FC<AdherenceProgressRingProps> = ({ percentage, label, size = 80 }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  const getColor = (pct: number): string => {
    if (pct >= 80) return '#22c55e';
    if (pct >= 60) return '#3b82f6';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <p className="text-lg font-bold text-gray-800 -mt-12">{percentage}%</p>
      <p className="text-xs text-gray-500 mt-6">{label}</p>
    </div>
  );
};
