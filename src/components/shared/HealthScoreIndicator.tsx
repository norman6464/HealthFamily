'use client';

interface HealthScoreIndicatorProps {
  score: number;
  label?: string;
}

function getScoreStyle(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function HealthScoreIndicator({ score, label }: HealthScoreIndicatorProps) {
  const style = getScoreStyle(score);

  return (
    <div className={`inline-flex flex-col items-center rounded-lg border px-4 py-2 ${style}`}>
      <span className="text-2xl font-bold">{score}</span>
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}
