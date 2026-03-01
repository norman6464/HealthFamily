import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ScheduleConflictBadgeProps {
  conflictCount: number;
  message?: string;
}

export const ScheduleConflictBadge: React.FC<ScheduleConflictBadgeProps> = ({ conflictCount, message }) => {
  if (conflictCount === 0) return null;

  return (
    <div className="flex items-center space-x-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
      <AlertCircle size={12} />
      <span>{message || `${conflictCount}件の重複`}</span>
    </div>
  );
};
