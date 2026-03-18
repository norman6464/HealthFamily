'use client';

import React, { useMemo } from 'react';
import { Clock, Pill, User, Trash2 } from 'lucide-react';
import { DailyRecordGroup, MedicationRecord, MedicationRecordEntity } from '../../domain/entities/MedicationRecord';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyStatePrompt } from '../shared/EmptyStatePrompt';

interface MemberRecordGroup {
  memberId: string;
  memberName: string;
  records: MedicationRecord[];
}

function groupByMember(records: MedicationRecord[]): MemberRecordGroup[] {
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
}

export const MedicationHistoryList: React.FC<MedicationHistoryListProps> = ({ groups, isLoading, onDelete }) => {
  const groupedByMember = useMemo(() => {
    return groups.map((group) => ({
      date: group.date,
      memberGroups: groupByMember(group.records),
    }));
  }, [groups]);

  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyStatePrompt message="服薬履歴がありません" subMessage="服薬を記録すると履歴が表示されます" />
    );
  }

  return (
    <div className="space-y-6">
      {groupedByMember.map((dayGroup) => (
        <div key={dayGroup.date}>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 px-1">
            {MedicationRecordEntity.formatDate(dayGroup.date)}
          </h3>
          <div className="space-y-4">
            {dayGroup.memberGroups.map((memberGroup) => (
              <div key={memberGroup.memberId}>
                <div className="flex items-center space-x-1.5 mb-1.5 px-1">
                  <User size={14} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">{memberGroup.memberName}</span>
                </div>
                <div className="space-y-2">
                  {memberGroup.records.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white rounded-lg shadow-sm p-3 border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <Pill size={18} className="text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{record.medicationName}</p>
                            {record.dosageAmount && (
                              <p className="text-xs text-gray-500 mt-0.5">{record.dosageAmount}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock size={14} />
                            <span>{MedicationRecordEntity.formatTime(record.takenAt)}</span>
                          </div>
                          {onDelete && (
                            <button
                              onClick={() => onDelete(record.id)}
                              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                              aria-label="削除"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {record.notes && (
                        <p className="text-xs text-gray-400 mt-1 pl-8">{record.notes}</p>
                      )}
                    </div>
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
