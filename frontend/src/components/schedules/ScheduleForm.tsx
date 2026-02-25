import React, { useState } from 'react';
import { DayOfWeek } from '../../domain/entities/Schedule';

export interface ScheduleFormData {
  scheduledTime: string;
  daysOfWeek: DayOfWeek[];
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

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSubmit }) => {
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [reminderMinutes, setReminderMinutes] = useState('10');

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDays.length === 0) return;

    onSubmit({
      scheduledTime,
      daysOfWeek: selectedDays,
      reminderMinutesBefore: parseInt(reminderMinutes, 10) || 0,
    });

    setScheduledTime('08:00');
    setSelectedDays([]);
    setReminderMinutes('10');
  };

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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">曜日</span>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer border-2 text-sm font-medium transition-colors ${
                selectedDays.includes(value)
                  ? 'bg-blue-600 text-white border-blue-600'
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
        </div>
      </div>

      <div>
        <label htmlFor="reminder-minutes" className="block text-sm font-medium text-gray-700 mb-1">
          リマインダー（分前）
        </label>
        <select
          id="reminder-minutes"
          value={reminderMinutes}
          onChange={(e) => setReminderMinutes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        スケジュールを追加
      </button>
    </form>
  );
};
