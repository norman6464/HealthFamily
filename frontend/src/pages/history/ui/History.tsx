import { useState, useMemo, useCallback } from "react";
import { Calendar, List, Plus } from "lucide-react";
import { MedicationHistoryList } from "./MedicationHistoryList";
import { MedicationCalendar } from "./MedicationCalendar";
import { AddPastRecordForm } from "./AddPastRecordForm";
import { MemberFilter } from "@/shared/ui";
import { api } from "@/shared/api";
import type { Medication } from "@/shared/api";
import {
  useMedicationHistory,
  filterGroupsByMember,
  formatRecordDate,
  toDateKey,
  type DailyRecordGroup,
} from "../model/history";

type ViewMode = "list" | "calendar";

export default function History() {
  const { groups, records, healthLogs, members, isLoading, deleteRecord, createRecord } = useMedicationHistory();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const memberOptions = useMemo(() => members.map((m) => ({ id: m.id, name: m.name })), [members]);

  const fetchMedicationsByMember = useCallback(async (memberId: string) => {
    const meds = await api.get<Medication[]>(`/members/${memberId}/medications`);
    return meds.map((m) => ({ id: m.id, name: m.name, memberId: m.memberId }));
  }, []);

  // メンバーフィルタ適用済みグループ
  const memberFilteredGroups = useMemo(
    () => filterGroupsByMember(groups, selectedMemberId),
    [groups, selectedMemberId],
  );

  // カレンダー用のメンバーフィルタ適用済みフラット配列
  const allRecords = useMemo(
    () => (selectedMemberId === null ? records : records.filter((r) => r.memberId === selectedMemberId)),
    [records, selectedMemberId],
  );

  // 選択日のレコードをフィルタリング
  const filteredGroups = useMemo<DailyRecordGroup[]>(() => {
    if (!selectedDate) return memberFilteredGroups;
    return memberFilteredGroups
      .map((g) => ({
        ...g,
        records: g.records.filter((r) => toDateKey(r.takenAt) === selectedDate),
      }))
      .filter((g) => g.records.length > 0);
  }, [memberFilteredGroups, selectedDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-800 tracking-wide">服薬履歴</h1>
        <div className="flex items-center space-x-1 bg-primary-50 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "calendar" ? "bg-white shadow-sm text-primary-600" : "text-ink-500"
            }`}
            aria-label="カレンダー表示"
          >
            <Calendar size={18} />
          </button>
          <button
            onClick={() => {
              setViewMode("list");
              setSelectedDate(null);
            }}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list" ? "bg-white shadow-sm text-primary-600" : "text-ink-500"
            }`}
            aria-label="リスト表示"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <div>
        <MemberFilter members={memberOptions} selectedMemberId={selectedMemberId} onSelect={setSelectedMemberId} />
      </div>

      {viewMode === "calendar" ? (
        <div className="space-y-4">
          <MedicationCalendar
            records={allRecords}
            healthLogs={healthLogs}
            onSelectDate={(dateKey) => {
              setSelectedDate(dateKey === selectedDate ? null : dateKey);
              setShowAddForm(false);
            }}
            selectedDate={selectedDate}
          />
          {selectedDate && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-ink-600">{formatRecordDate(selectedDate)} の記録</h3>
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
              <MedicationHistoryList groups={filteredGroups} isLoading={isLoading} onDelete={deleteRecord} />
            </div>
          )}
          {!selectedDate && <p className="text-center text-sm text-ink-400 py-2">日付をタップして詳細を表示</p>}
        </div>
      ) : (
        <MedicationHistoryList groups={memberFilteredGroups} isLoading={isLoading} onDelete={deleteRecord} />
      )}
    </div>
  );
}
