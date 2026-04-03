'use client';

import React, { useState } from 'react';
import { Clock, Trash2, Pencil, Check, X } from 'lucide-react';
import { Schedule, DayOfWeek } from '../../domain/entities/Schedule';
import { ScheduleWithDetails } from '../../domain/repositories/ScheduleRepository';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyStatePrompt } from '../shared/EmptyStatePrompt';

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
  onUpdate: (scheduleId: string, input: Partial<Schedule>, options?: { clearInterval?: boolean }) => Promise<void>;
  onDelete: (scheduleId: string) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, isLoading, onUpdate, onDelete }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (schedules.length === 0) {
    return (
      <EmptyStatePrompt message="スケジュールがありません" subMessage="薬の詳細画面からスケジュールを追加できます" />
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

export interface ScheduleCardProps {
  item: ScheduleWithDetails;
  onUpdate: (scheduleId: string, input: Partial<Schedule>, options?: { clearInterval?: boolean }) => Promise<void>;
  onDelete: (scheduleId: string) => void;
}

type EditMode = 'daily' | 'weekdays' | 'interval' | 'prn';

const INTERVAL_OPTIONS = [
  { value: 2, label: '2日毎' },
  { value: 3, label: '3日毎' },
  { value: 7, label: '1週間毎' },
  { value: 14, label: '2週間毎' },
  { value: 21, label: '3週間毎' },
  { value: 28, label: '4週間毎' },
  { value: 30, label: '1ヶ月毎' },
  { value: 60, label: '2ヶ月毎' },
  { value: 90, label: '3ヶ月毎' },
];

function getInitialMode(schedule: Schedule): EditMode {
  if (schedule.intervalDays === -1) return 'prn';
  if (schedule.intervalDays && schedule.intervalDays > 0 && schedule.startDate) return 'interval';
  if (schedule.daysOfWeek.length > 0) return 'weekdays';
  return 'daily';
}

const ScheduleCard: React.FC<ScheduleCardProps> = React.memo(({ item, onUpdate, onDelete }) => {
  const { schedule, medicationName, memberName } = item;
  const [isEditing, setIsEditing] = useState(false);
  const [editTime, setEditTime] = useState(schedule.scheduledTime);
  const [editMode, setEditMode] = useState<EditMode>(() => getInitialMode(schedule));
  const [editDays, setEditDays] = useState<DayOfWeek[]>([...schedule.daysOfWeek]);
  const [editIntervalDays, setEditIntervalDays] = useState(String(schedule.intervalDays || 21));
  const [editStartDate, setEditStartDate] = useState(() => {
    if (schedule.startDate) {
      const d = new Date(schedule.startDate);
      return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  const daysLabel = schedule.intervalDays === -1
    ? '頓服'
    : schedule.intervalDays && schedule.intervalDays > 0 && schedule.startDate
      ? `${schedule.intervalDays}日毎`
      : schedule.daysOfWeek.length === 7
        ? '毎日'
        : schedule.daysOfWeek.length === 0
          ? '毎日'
          : DAY_ORDER.filter((d) => schedule.daysOfWeek.includes(d)).map((d) => DAY_LABELS[d]).join('・');

  const toggleDay = (day: DayOfWeek) => {
    setEditDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const canSave = editMode === 'daily'
    || editMode === 'prn'
    || (editMode === 'weekdays' && editDays.length > 0)
    || (editMode === 'interval' && editStartDate);

  const handleSave = async () => {
    if (!canSave) return;
    const wasInterval = getInitialMode(schedule) === 'interval';
    const wasPrn = getInitialMode(schedule) === 'prn';
    const shouldClearInterval = (wasInterval || wasPrn) && editMode !== 'interval' && editMode !== 'prn';
    let updateData: Partial<Schedule>;
    if (editMode === 'prn') {
      updateData = { scheduledTime: '00:00', daysOfWeek: [], intervalDays: -1 };
    } else if (editMode === 'interval') {
      updateData = {
        scheduledTime: editTime,
        daysOfWeek: [],
        intervalDays: parseInt(editIntervalDays, 10),
        startDate: new Date(editStartDate),
      };
    } else if (editMode === 'weekdays') {
      updateData = { scheduledTime: editTime, daysOfWeek: editDays };
    } else {
      updateData = { scheduledTime: editTime, daysOfWeek: [] };
    }
    await onUpdate(schedule.id, updateData, shouldClearInterval ? { clearInterval: true } : undefined);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTime(schedule.scheduledTime);
    setEditMode(getInitialMode(schedule));
    setEditDays([...schedule.daysOfWeek]);
    setEditIntervalDays(String(schedule.intervalDays || 21));
    setIsEditing(false);
  };

  const handleToggleEnabled = () => {
    onUpdate(schedule.id, { isEnabled: !schedule.isEnabled });
  };

  const modeButtonClass = (m: EditMode) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      editMode === m
        ? 'bg-primary-600 text-white'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
    }`;

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-primary-200">
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-2">頻度</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <button type="button" className={modeButtonClass('daily')} onClick={() => setEditMode('daily')}>
                毎日
              </button>
              <button type="button" className={modeButtonClass('weekdays')} onClick={() => setEditMode('weekdays')}>
                曜日指定
              </button>
              <button type="button" className={modeButtonClass('interval')} onClick={() => setEditMode('interval')}>
                間隔指定
              </button>
              <button type="button" className={modeButtonClass('prn')} onClick={() => setEditMode('prn')}>
                頓服
              </button>
            </div>

            {editMode === 'prn' && (
              <p className="text-xs text-gray-500">症状がある時だけ服用。ホーム画面には表示されません。</p>
            )}
          </div>

          {editMode !== 'prn' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">服薬時刻</label>
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          )}

          {editMode !== 'prn' && (
          <div>

            {editMode === 'weekdays' && (
              <div>
                <div className="flex gap-1">
                  {DAY_ORDER.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        editDays.includes(day)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>
                {editDays.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">曜日を選択してください</p>
                )}
              </div>
            )}

            {editMode === 'interval' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">投与間隔</label>
                  <select
                    value={editIntervalDays}
                    onChange={(e) => setEditIntervalDays(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    {INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">開始日（最初の投与日）</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                    required
                  />
                </div>
              </div>
            )}
          </div>
          )}
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 flex items-center justify-center space-x-1 bg-primary-600 text-white py-1.5 rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
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
    <div className="bg-white rounded-2xl shadow-soft p-3 border border-pink-100">
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
            className="text-gray-400 hover:text-primary-500 p-1 transition-colors"
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
});

ScheduleCard.displayName = 'ScheduleCard';
