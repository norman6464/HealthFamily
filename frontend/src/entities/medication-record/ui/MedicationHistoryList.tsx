import React, { useMemo, useState } from "react";
import { Clock, Pill, User, Trash2, Pencil, Check, X } from "lucide-react";
import { LoadingSpinner } from "@/shared/ui";
import { EmptyStatePrompt } from "@/shared/ui";
import type { DailyRecordGroup, EnrichedRecord } from "../model/records";
import { formatRecordDate, formatRecordTime } from "../model/records";

interface MemberRecordGroup {
  memberId: string;
  memberName: string;
  records: EnrichedRecord[];
}

function groupByMember(records: EnrichedRecord[]): MemberRecordGroup[] {
  const map = new Map<string, MemberRecordGroup>();
  for (const record of records) {
    let group = map.get(record.memberId);
    if (!group) {
      group = { memberId: record.memberId, memberName: record.memberName, records: [] };
      map.set(record.memberId, group);
    }
    group.records.push(record);
  }
  return Array.from(map.values());
}

interface MedicationHistoryListProps {
  groups: DailyRecordGroup[];
  isLoading: boolean;
  onDelete?: (recordId: string) => void;
  onUpdateNotes?: (recordId: string, notes: string | null) => Promise<void>;
}

export const MedicationHistoryList: React.FC<MedicationHistoryListProps> = ({
  groups,
  isLoading,
  onDelete,
  onUpdateNotes,
}) => {
  const groupedByMember = useMemo(() => {
    return groups.map((group) => ({
      date: group.date,
      memberGroups: groupByMember(group.records),
    }));
  }, [groups]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (groups.length === 0) {
    return <EmptyStatePrompt message="服薬履歴がありません" subMessage="服薬を記録すると履歴が表示されます" />;
  }

  return (
    <div className="space-y-6">
      {groupedByMember.map((dayGroup) => (
        <div key={dayGroup.date}>
          <h3 className="text-sm font-semibold text-ink-600 mb-2 px-1">{formatRecordDate(dayGroup.date)}</h3>
          <div className="space-y-4">
            {dayGroup.memberGroups.map((memberGroup) => (
              <div key={memberGroup.memberId}>
                <div className="flex items-center space-x-1.5 mb-1.5 px-1">
                  <User size={14} className="text-ink-400" />
                  <span className="text-xs font-medium text-ink-500">{memberGroup.memberName}</span>
                </div>
                <div className="space-y-2">
                  {memberGroup.records.map((record) => (
                    <RecordCard key={record.id} record={record} onDelete={onDelete} onUpdateNotes={onUpdateNotes} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface RecordCardProps {
  record: EnrichedRecord;
  onDelete?: (recordId: string) => void;
  onUpdateNotes?: (recordId: string, notes: string | null) => Promise<void>;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, onDelete, onUpdateNotes }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState(record.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleStartEdit = () => {
    setEditNotes(record.notes || "");
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdateNotes) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateNotes(record.id, editNotes.trim() || null);
      setIsEditing(false);
    } catch {
      setSaveError("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Pill size={18} className="text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-ink-800 truncate">{record.medicationName}</p>
            {record.dosageAmount && <p className="text-xs text-ink-500 mt-0.5">{record.dosageAmount}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          <div className="flex items-center space-x-1 text-sm text-ink-500">
            <Clock size={14} />
            <span>{formatRecordTime(record.takenAt)}</span>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(record.id)}
              className="text-ink-400 hover:text-red-500 p-1 transition-colors"
              aria-label="削除"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="mt-2 pl-8">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="flex-1 rounded border border-primary-200 px-2 py-1 text-xs"
              placeholder="メモを入力"
              maxLength={500}
              autoFocus
              disabled={isSaving}
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
              aria-label="保存"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="p-1 text-ink-400 hover:text-ink-600 disabled:opacity-50"
              aria-label="キャンセル"
            >
              <X size={14} />
            </button>
          </div>
          {saveError && <p className="text-xs text-red-500 mt-1">{saveError}</p>}
        </div>
      ) : (
        <div className="mt-1 pl-8 flex items-center gap-1">
          {record.notes ? <p className="text-xs text-ink-400">{record.notes}</p> : null}
          {onUpdateNotes && (
            <button
              onClick={handleStartEdit}
              className="p-0.5 text-ink-300 hover:text-ink-500 transition-colors"
              aria-label="メモを編集"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
