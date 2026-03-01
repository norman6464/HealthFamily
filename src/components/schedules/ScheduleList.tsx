'use client';

import React, { useState } from 'react';
import { Clock, Trash2, Pencil, Check, X } from 'lucide-react';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { ScheduleWithDetails } from '../../domain/repositories/ScheduleRepository';

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
};

const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

interface ScheduleListProps {
  schedules: ScheduleWithDetails[];
  isLoading: boolean;
  onUpdate: (scheduleId: string, input: Partial<Schedule>) => Promise<void>;
  onDelete: (scheduleId: string) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <p className="text-gray-500 text-lg">スケジュールがありません</p>
      </div>
    );
  }

  const enabled = schedules.filter((s) => s.schedule.isEnabled);
  const disabled = schedules.filter((s) => !s.schedule.isEnabled);

  return (
    <div className="space-y-6">
      {enabled.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2 px-1">有効なスケジュール</h3>
          <div className="space-y-2">
            {enabled.map((item) => (
              <ScheduleCard key={item.schedule.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}

      {disabled.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2 px-1">無効なスケジュール</h3>
          <div className="space-y-2 opacity-60">
            {disabled.map((item) => (
              <ScheduleCard key={item.schedule.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ScheduleCardProps {
  item: ScheduleWithDetails;
  onUpdate: (scheduleId: string, input: Partial<Schedule>) => Promise<void>;
  onDelete: (scheduleId: string) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ item, onUpdate, onDelete }) => {
  const { schedule, medicationName, memberName } = item;
  const [isEditing, setIsEditing] = useState(false);
  const [editTime, setEditTime] = useState(schedule.scheduledTime);
  const [editDays, setEditDays] = useState<DayOfWeek[]>([...schedule.daysOfWeek]);

  const daysLabel = schedule.daysOfWeek.length === 7
    ? '毎日'
    : schedule.daysOfWeek.length === 0
      ? '曜日未設定'
      : DAY_ORDER.filter((d) => schedule.daysOfWeek.includes(d)).map((d) => DAY_LABELS[d]).join('・');

  const toggleDay = (day: DayOfWeek) => {
    setEditDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    await onUpdate(schedule.id, {
      scheduledTime: editTime,
      daysOfWeek: editDays,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTime(schedule.scheduledTime);
    setEditDays([...schedule.daysOfWeek]);
    setIsEditing(false);
  };

  const handleToggleEnabled = () => {
    onUpdate(schedule.id, { isEnabled: !schedule.isEnabled });
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-200">
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">服薬時刻</label>
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">曜日</label>
            <div className="flex gap-1">
              {DAY_ORDER.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    editDays.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={editDays.length === 0}
              className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Check size={14} />
              <span>保存</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center space-x-1 bg-gray-200 text-gray-700 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition-colors"
            >
              <X size={14} />
              <span>キャンセル</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            <Clock size={18} className="text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm">
              {schedule.scheduledTime}
              <span className="ml-2 text-xs text-gray-500">{daysLabel}</span>
            </p>
            <div className="text-xs text-gray-500 mt-1">
              <span>{memberName}</span>
              <span className="mx-1">-</span>
              <span>{medicationName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={handleToggleEnabled}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              schedule.isEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {schedule.isEnabled ? '有効' : '無効'}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-blue-500 p-1 transition-colors"
            aria-label="編集"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
            aria-label="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
