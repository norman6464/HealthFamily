'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { MissedDose } from '../../presentation/hooks/useMissedDoses';

interface MissedDosesAlertProps {
  missedDoses: MissedDose[];
  isLoading: boolean;
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

export const MissedDosesAlert: React.FC<MissedDosesAlertProps> = ({ missedDoses, isLoading }) => {
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

  return (
    <div className="mb-4">
      <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-100">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <h3 className="text-sm font-bold text-red-800">
            飲み忘れがあります（{missedDoses.length}件）
          </h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          {dateGroups.map((group) => (
            <div key={group.date}>
              <p className="text-xs font-semibold text-red-700 mb-1">{group.dateLabel}</p>
              <div className="space-y-1">
                {group.items.map((dose) => (
                  <div
                    key={`${dose.date}-${dose.scheduleId}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-800">
                      <span className="text-gray-500">{dose.memberName}</span>
                      {' '}
                      <span className="font-medium">{dose.medicationName}</span>
                    </span>
                    <span className="text-xs text-gray-500">{dose.scheduledTime}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-3">
          <Link
            href="/history"
            className="block text-center text-xs text-red-600 hover:text-red-700 font-medium py-1.5 rounded-md bg-red-100 hover:bg-red-200 transition-colors"
          >
            履歴から記録を追加
          </Link>
        </div>
      </div>
    </div>
  );
};
