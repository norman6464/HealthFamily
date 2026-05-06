'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { MissedDose } from '../../presentation/hooks/useMissedDoses';

interface MissedDosesAlertProps {
  missedDoses: MissedDose[];
  isLoading: boolean;
  onMarkAsTaken?: (dose: MissedDose) => Promise<void>;
  onMarkMultipleAsTaken?: (doses: MissedDose[]) => Promise<void>;
}

interface DateGroup {
  date: string;
  dateLabel: string;
  items: MissedDose[];
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dateKey;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return dateKey;
  const dow = DAY_LABELS[date.getDay()] ?? '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return `昨日（${m}/${d} ${dow}）`;
  if (diffDays === 2) return `一昨日（${m}/${d} ${dow}）`;
  return `${m}月${d}日（${dow}）`;
}

export const MissedDosesAlert: React.FC<MissedDosesAlertProps> = ({
  missedDoses,
  isLoading,
  onMarkAsTaken,
  onMarkMultipleAsTaken,
}) => {
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [bulkTarget, setBulkTarget] = useState<string | null>(null);

  const dateGroups = useMemo(() => {
    if (missedDoses.length === 0) return [];
    const map = new Map<string, MissedDose[]>();
    for (const dose of missedDoses) {
      const group = map.get(dose.date) || [];
      group.push(dose);
      map.set(dose.date, group);
    }
    const groups: DateGroup[] = [];
    for (const [date, items] of map) {
      groups.push({ date, dateLabel: formatDateLabel(date), items });
    }
    groups.sort((a, b) => b.date.localeCompare(a.date));
    return groups;
  }, [missedDoses]);

  if (isLoading || missedDoses.length === 0) return null;

  const handleMarkOne = async (dose: MissedDose) => {
    if (!onMarkAsTaken) return;
    const key = `${dose.date}-${dose.scheduleId}`;
    setRecordingId(key);
    try {
      await onMarkAsTaken(dose);
    } finally {
      setRecordingId(null);
    }
  };

  const handleMarkAllForDate = async (group: DateGroup) => {
    if (!onMarkMultipleAsTaken) return;
    setBulkTarget(group.date);
    try {
      await onMarkMultipleAsTaken(group.items);
    } finally {
      setBulkTarget(null);
    }
  };

  const handleMarkAll = async () => {
    if (!onMarkMultipleAsTaken) return;
    setBulkTarget('all');
    try {
      await onMarkMultipleAsTaken(missedDoses);
    } finally {
      setBulkTarget(null);
    }
  };

  return (
    <div className="mb-4">
      <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-red-100">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
            <h3 className="text-sm font-bold text-red-800 truncate">
              飲み忘れがあります（{missedDoses.length}件）
            </h3>
          </div>
          {onMarkMultipleAsTaken && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={bulkTarget !== null || recordingId !== null}
              className="flex items-center gap-1 text-xs text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2 py-1 rounded font-medium flex-shrink-0"
            >
              {bulkTarget === 'all' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              <span>全て記録</span>
            </button>
          )}
        </div>
        <div className="px-4 py-3 space-y-3">
          {dateGroups.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-red-700">{group.dateLabel}</p>
                {onMarkMultipleAsTaken && group.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleMarkAllForDate(group)}
                    disabled={bulkTarget !== null || recordingId !== null}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 font-medium flex items-center gap-1"
                  >
                    {bulkTarget === group.date ? <Loader2 size={11} className="animate-spin" /> : null}
                    <span>この日全て記録</span>
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {group.items.map((dose) => {
                  const key = `${dose.date}-${dose.scheduleId}`;
                  const isRecording = recordingId === key;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-gray-800 min-w-0 truncate">
                        <span className="text-gray-500">{dose.memberName}</span>
                        {' '}
                        <span className="font-medium">{dose.medicationName}</span>
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">{dose.scheduledTime}</span>
                        {onMarkAsTaken && (
                          <button
                            type="button"
                            onClick={() => handleMarkOne(dose)}
                            disabled={isRecording || bulkTarget !== null}
                            aria-label="記録する"
                            className="flex items-center gap-1 text-xs text-red-700 hover:text-white hover:bg-red-600 disabled:opacity-50 border border-red-300 hover:border-red-600 px-2 py-0.5 rounded transition-colors"
                          >
                            {isRecording ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                            <span>記録</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
