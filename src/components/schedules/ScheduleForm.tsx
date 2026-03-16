import React, { useState } from 'react';
import { DayOfWeek } from '../../domain/entities/Schedule';

export type ScheduleMode = 'daily' | 'weekdays' | 'interval';

export interface ScheduleFormData {
  scheduledTime: string;
  daysOfWeek: DayOfWeek[];
  intervalDays?: number;
  startDate?: string;
  reminderMinutesBefore: number;
}

interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => void;
}

const DAY_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: '月' },
  { value: 'tue', label: '火' },
  { value: 'wed', label: '水' },
  { value: 'thu', label: '木' },
  { value: 'fri', label: '金' },
  { value: 'sat', label: '土' },
  { value: 'sun', label: '日' },
];

const INTERVAL_OPTIONS = [
  { value: 2, label: '2日ごと' },
  { value: 3, label: '3日ごと' },
  { value: 7, label: '1週間ごと' },
  { value: 14, label: '2週間ごと' },
  { value: 21, label: '3週間ごと' },
  { value: 28, label: '4週間ごと' },
  { value: 30, label: '1ヶ月ごと' },
  { value: 60, label: '2ヶ月ごと' },
  { value: 90, label: '3ヶ月ごと' },
];

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSubmit }) => {
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [mode, setMode] = useState<ScheduleMode>('daily');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [intervalDays, setIntervalDays] = useState('21');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reminderMinutes, setReminderMinutes] = useState('10');

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'weekdays' && selectedDays.length === 0) return;
    if (mode === 'interval' && !startDate) return;

    onSubmit({
      scheduledTime,
      daysOfWeek: mode === 'weekdays' ? selectedDays : [],
      intervalDays: mode === 'interval' ? parseInt(intervalDays, 10) : undefined,
      startDate: mode === 'interval' ? startDate : undefined,
      reminderMinutesBefore: parseInt(reminderMinutes, 10) || 0,
    });

    setScheduledTime('08:00');
    setSelectedDays([]);
    setMode('daily');
    setReminderMinutes('10');
  };

  const modeButtonClass = (m: ScheduleMode) =>
    `flex items-center justify-center px-3 h-10 rounded-full cursor-pointer border-2 text-sm font-medium transition-colors ${
      mode === m
        ? 'bg-primary-600 text-white border-blue-600'
        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700 mb-1">
          服薬時刻
        </label>
        <input
          id="schedule-time"
          type="time"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">頻度</span>
        <div className="flex flex-wrap gap-2 mb-2">
          <button type="button" className={modeButtonClass('daily')} onClick={() => setMode('daily')}>
            毎日
          </button>
          <button type="button" className={modeButtonClass('weekdays')} onClick={() => setMode('weekdays')}>
            曜日指定
          </button>
          <button type="button" className={modeButtonClass('interval')} onClick={() => setMode('interval')}>
            間隔指定
          </button>
        </div>

        {mode === 'weekdays' && (
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer border-2 text-sm font-medium transition-colors ${
                  selectedDays.includes(value)
                    ? 'bg-primary-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDays.includes(value)}
                  onChange={() => toggleDay(value)}
                  className="sr-only"
                  aria-label={label}
                />
                {label}
              </label>
            ))}
            {selectedDays.length === 0 && (
              <p className="w-full text-sm text-red-500 mt-1">曜日を選択してください</p>
            )}
          </div>
        )}

        {mode === 'interval' && (
          <div className="space-y-3 mt-2">
            <div>
              <label htmlFor="interval-days" className="block text-xs text-gray-500 mb-1">
                投与間隔
              </label>
              <select
                id="interval-days"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="start-date" className="block text-xs text-gray-500 mb-1">
                開始日（最初の投与日）
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                required
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="reminder-minutes" className="block text-sm font-medium text-gray-700 mb-1">
          リマインダー（分前）
        </label>
        <select
          id="reminder-minutes"
          value={reminderMinutes}
          onChange={(e) => setReminderMinutes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="0">なし</option>
          <option value="5">5分前</option>
          <option value="10">10分前</option>
          <option value="15">15分前</option>
          <option value="30">30分前</option>
          <option value="60">1時間前</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
      >
        スケジュールを追加
      </button>
    </form>
  );
};
