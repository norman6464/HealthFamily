'use client';

import { useState, useMemo } from 'react';
import { Calendar, List } from 'lucide-react';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { MedicationHistoryList } from '@/components/history/MedicationHistoryList';
import { MedicationCalendar } from '@/components/history/MedicationCalendar';
import { useMedicationHistory } from '@/presentation/hooks/useMedicationHistory';
import { useHealthLogs } from '@/presentation/hooks/useHealthLogs';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

type ViewMode = 'list' | 'calendar';

export default function HistoryPage() {
  const { groups, isLoading, deleteRecord } = useMedicationHistory();
  const { groups: healthLogGroups } = useHealthLogs();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // groupsからフラットなレコード配列を取得
  const allRecords = useMemo(
    () => groups.flatMap((g) => g.records),
    [groups],
  );

  // groupsからフラットな体調記録配列を取得
  const allHealthLogs = useMemo(
    () => healthLogGroups.flatMap((g) => g.logs),
    [healthLogGroups],
  );

  // 選択日のレコードをフィルタリング
  const filteredGroups = useMemo(() => {
    if (!selectedDate) return groups;
    const filtered = groups
      .map((g) => ({
        ...g,
        records: g.records.filter((r) => {
          const d = r.takenAt;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return key === selectedDate;
        }),
      }))
      .filter((g) => g.records.length > 0);
    return filtered;
  }, [groups, selectedDate]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">服薬履歴</h1>
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
              }`}
              aria-label="カレンダー表示"
            >
              <Calendar size={18} />
            </button>
            <button
              onClick={() => { setViewMode('list'); setSelectedDate(null); }}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
              }`}
              aria-label="リスト表示"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {viewMode === 'calendar' ? (
          <div className="space-y-4">
            <MedicationCalendar
              records={allRecords}
              healthLogs={allHealthLogs}
              onSelectDate={(dateKey) => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
              selectedDate={selectedDate}
            />
            {selectedDate && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  {MedicationRecordEntity.formatDate(selectedDate)} の記録
                </h3>
                <MedicationHistoryList
                  groups={filteredGroups}
                  isLoading={isLoading}
                  onDelete={deleteRecord}
                />
              </div>
            )}
            {!selectedDate && (
              <p className="text-center text-sm text-gray-400 py-2">
                日付をタップして詳細を表示
              </p>
            )}
          </div>
        ) : (
          <MedicationHistoryList groups={groups} isLoading={isLoading} onDelete={deleteRecord} />
        )}
      </main>

      <BottomNavigation activePath="/history" />
    </div>
  );
}
