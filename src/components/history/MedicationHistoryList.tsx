'use client';

import React from 'react';
import { Clock, Pill, User, Trash2 } from 'lucide-react';
import { DailyRecordGroup, MedicationRecordEntity } from '../../domain/entities/MedicationRecord';

interface MedicationHistoryListProps {
  groups: DailyRecordGroup[];
  isLoading: boolean;
  onDelete?: (recordId: string) => void;
}

export const MedicationHistoryList: React.FC<MedicationHistoryListProps> = ({ groups, isLoading, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <p className="text-gray-500 text-lg">服薬履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 px-1">
            {MedicationRecordEntity.formatDate(group.date)}
          </h3>
          <div className="space-y-2">
            {group.records.map((record) => (
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
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <User size={12} />
                          <span>{record.memberName}</span>
                        </span>
                        {record.dosageAmount && (
                          <span>{record.dosageAmount}</span>
                        )}
                      </div>
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
  );
};
