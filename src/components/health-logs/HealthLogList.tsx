'use client';

import React from 'react';
import { User, Trash2 } from 'lucide-react';
import {
  DailyHealthLogGroup,
  HealthLogEntity,
  ConditionLevel,
} from '../../domain/entities/HealthLog';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyStatePrompt } from '../shared/EmptyStatePrompt';

interface HealthLogListProps {
  groups: DailyHealthLogGroup[];
  isLoading: boolean;
  onDelete?: (logId: string) => void;
}

export const HealthLogList: React.FC<HealthLogListProps> = ({ groups, isLoading, onDelete }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyStatePrompt message="体調記録がありません" subMessage="上のボタンから記録を追加してください" />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 px-1">
            {HealthLogEntity.formatDate(group.date)}
          </h3>
          <div className="space-y-2">
            {group.logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-lg shadow-sm p-3 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <span className={`text-xl font-bold ${HealthLogEntity.getConditionColor(log.conditionLevel)}`}>
                        {log.conditionLevel}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">
                        {HealthLogEntity.getConditionLabel(log.conditionLevel as ConditionLevel)}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                        <User size={12} />
                        <span>{log.memberName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <span className="text-sm text-gray-500">
                      {log.recordedAt.getHours().toString().padStart(2, '0')}:
                      {log.recordedAt.getMinutes().toString().padStart(2, '0')}
                    </span>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(log.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        aria-label="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {log.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pl-8">
                    {log.symptoms.map((symptom) => (
                      <span
                        key={symptom}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {HealthLogEntity.getSymptomLabel(symptom)}
                      </span>
                    ))}
                  </div>
                )}
                {log.notes && (
                  <p className="text-xs text-gray-400 mt-1 pl-8">{log.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
