import React, { useMemo } from 'react';
import { Check, Clock } from 'lucide-react';

export interface TimelineItem {
  id: string;
  time: string;
  medicationName: string;
  memberName: string;
  isCompleted: boolean;
}

interface ScheduleTimelineViewProps {
  items: TimelineItem[];
}

export const ScheduleTimelineView: React.FC<ScheduleTimelineViewProps> = ({ items }) => {
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.time.localeCompare(b.time)),
    [items],
  );

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        今日のスケジュールはありません
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedItems.map((item) => (
        <div key={item.id} className="flex items-center space-x-3 py-2">
          <span className="text-xs font-mono text-gray-500 w-12 text-right">{item.time}</span>
          <div className="relative">
            {item.isCompleted ? (
              <span aria-label="完了済み" className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                <Check size={12} className="text-white" />
              </span>
            ) : (
              <span className="flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded-full">
                <Clock size={10} className="text-gray-400" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 truncate">{item.medicationName}</p>
            <p className="text-xs text-gray-400 truncate">{item.memberName}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
