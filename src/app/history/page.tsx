'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, List, Plus, Download } from 'lucide-react';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { MedicationHistoryList } from '@/components/history/MedicationHistoryList';
import { MedicationCalendar } from '@/components/history/MedicationCalendar';
import { AddPastRecordForm } from '@/components/history/AddPastRecordForm';
import { MemberFilter } from '@/components/shared/MemberFilter';
import { useMedicationHistory } from '@/presentation/hooks/useMedicationHistory';
import { useHealthLogs } from '@/presentation/hooks/useHealthLogs';
import { useMembers } from '@/presentation/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';
import { getDIContainer } from '@/infrastructure/DIContainer';

type ViewMode = 'list' | 'calendar';

export default function HistoryPage() {
  const { userId } = useAuth();
  const { groups, isLoading, deleteRecord, updateRecord, createRecord } = useMedicationHistory();
  const { groups: healthLogGroups } = useHealthLogs();
  const { members } = useMembers(userId);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const memberOptions = useMemo(
    () => members.map((m) => ({ id: m.id, name: m.name })),
    [members],
  );

  const handleUpdateNotes = useCallback(async (recordId: string, notes: string | null) => {
    await updateRecord(recordId, { notes });
  }, [updateRecord]);

  const fetchMedicationsByMember = useCallback(async (memberId: string) => {
    const { medicationRepository } = getDIContainer();
    const meds = await medicationRepository.getMedicationsByMember(memberId);
    return meds.map((m) => ({ id: m.id, name: m.name, memberId: m.memberId }));
  }, []);

  // メンバーフィルタ適用済みグループ
  const memberFilteredGroups = useMemo(
    () => MedicationRecordEntity.filterGroupsByMember(groups, selectedMemberId),
    [groups, selectedMemberId],
  );

  // groupsからフラットなレコード配列を取得（メンバーフィルタ適用済み）
  const allRecords = useMemo(
    () => MedicationRecordEntity.filterByMember(
      groups.flatMap((g) => g.records),
      selectedMemberId,
    ),
    [groups, selectedMemberId],
  );

  // groupsからフラットな体調記録配列を取得
  const allHealthLogs = useMemo(
    () => healthLogGroups.flatMap((g) => g.logs),
    [healthLogGroups],
  );

  // 選択日のレコードをフィルタリング
  const filteredGroups = useMemo(() => {
    if (!selectedDate) return memberFilteredGroups;
    const filtered = memberFilteredGroups
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
  }, [memberFilteredGroups, selectedDate]);

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-header shadow-soft">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">服薬履歴</h1>
          <div className="flex items-center space-x-2">
            <a
              href={`/api/records/export${selectedMemberId ? `?memberId=${encodeURIComponent(selectedMemberId)}` : ''}`}
              download
              className="p-1.5 text-gray-500 hover:text-primary-600 transition-colors"
              aria-label="CSVエクスポート"
            >
              <Download size={18} />
            </a>
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
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <div className="mb-4">
          <MemberFilter
            members={memberOptions}
            selectedMemberId={selectedMemberId}
            onSelect={setSelectedMemberId}
          />
        </div>
        {viewMode === 'calendar' ? (
          <div className="space-y-4">
            <MedicationCalendar
              records={allRecords}
              healthLogs={allHealthLogs}
              onSelectDate={(dateKey) => {
                setSelectedDate(dateKey === selectedDate ? null : dateKey);
                setShowAddForm(false);
              }}
              selectedDate={selectedDate}
            />
            {selectedDate && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">
                    {MedicationRecordEntity.formatDate(selectedDate)} の記録
                  </h3>
                  {!showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Plus size={14} />
                      <span>記録を追加</span>
                    </button>
                  )}
                </div>
                {showAddForm && (
                  <div className="mb-3">
                    <AddPastRecordForm
                      selectedDate={selectedDate}
                      members={memberOptions}
                      fetchMedicationsByMember={fetchMedicationsByMember}
                      onSubmit={createRecord}
                      onClose={() => setShowAddForm(false)}
                    />
                  </div>
                )}
                <MedicationHistoryList
                  groups={filteredGroups}
                  isLoading={isLoading}
                  onDelete={deleteRecord}
                  onUpdateNotes={handleUpdateNotes}
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
          <MedicationHistoryList groups={memberFilteredGroups} isLoading={isLoading} onDelete={deleteRecord} onUpdateNotes={handleUpdateNotes} />
        )}
      </main>

      <BottomNavigation activePath="/history" />
    </div>
  );
}
