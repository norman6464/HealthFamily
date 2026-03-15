'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEntity, CalendarDay } from '../../domain/entities/Calendar';
import { MedicationRecord } from '../../domain/entities/MedicationRecord';
import { HealthLog } from '../../domain/entities/HealthLog';

interface MedicationCalendarProps {
  records: MedicationRecord[];
  healthLogs: HealthLog[];
  onSelectDate: (dateKey: string) => void;
  selectedDate: string | null;
}

export const MedicationCalendar: React.FC<MedicationCalendarProps> = ({
  records,
  healthLogs,
  onSelectDate,
  selectedDate,
}) => {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const days = useMemo(() => {
    const baseDays = CalendarEntity.generateMonth(year, month, today);

    // 記録件数をマッピング
    const recordCounts = new Map<string, number>();
    for (const record of records) {
      const key = CalendarEntity.formatDateKey(record.takenAt);
      recordCounts.set(key, (recordCounts.get(key) || 0) + 1);
    }

    // 体調レベルをマッピング
    const conditionMap = new Map<string, number[]>();
    for (const log of healthLogs) {
      const key = CalendarEntity.formatDateKey(log.recordedAt);
      if (!conditionMap.has(key)) conditionMap.set(key, []);
      conditionMap.get(key)!.push(log.conditionLevel);
    }

    return baseDays.map((day) => {
      const key = CalendarEntity.formatDateKey(day.date);
      const conditions = conditionMap.get(key);
      return {
        ...day,
        recordCount: recordCounts.get(key) || 0,
        averageCondition: conditions
          ? Math.round((conditions.reduce((a, b) => a + b, 0) / conditions.length) * 10) / 10
          : null,
      };
    });
  }, [year, month, records, healthLogs, today]);

  const handlePrevMonth = () => {
    const prev = CalendarEntity.getPreviousMonth(year, month);
    setYear(prev.year);
    setMonth(prev.month);
  };

  const handleNextMonth = () => {
    const next = CalendarEntity.getNextMonth(year, month);
    setYear(next.year);
    setMonth(next.month);
  };

  const weekdays = CalendarEntity.getWeekdayHeaders();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="前月"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-base font-semibold text-gray-800">
          {CalendarEntity.getMonthLabel(year, month)}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="翌月"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekdays.map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, index) => (
          <CalendarDayCell
            key={index}
            day={day}
            isSelected={selectedDate === CalendarEntity.formatDateKey(day.date)}
            onClick={() => onSelectDate(CalendarEntity.formatDateKey(day.date))}
          />
        ))}
      </div>

      <div className="flex items-center justify-center space-x-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm bg-green-100" />
          <span>1-2件</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm bg-green-200" />
          <span>3-5件</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-sm bg-green-300" />
          <span>6件+</span>
        </div>
      </div>
    </div>
  );
};

interface CalendarDayCellProps {
  day: CalendarDay;
  isSelected: boolean;
  onClick: () => void;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({ day, isSelected, onClick }) => {
  const bgColor = CalendarEntity.getRecordCountColor(day.recordCount);
  const dayOfWeek = day.date.getDay();

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square flex flex-col items-center justify-center
        text-sm rounded-md transition-colors
        ${day.isCurrentMonth ? 'text-gray-800' : 'text-gray-300'}
        ${day.isToday ? 'ring-2 ring-primary-500' : ''}
        ${isSelected ? 'bg-primary-100 ring-2 ring-primary-600' : bgColor || 'hover:bg-gray-50'}
        ${dayOfWeek === 0 && day.isCurrentMonth ? 'text-red-500' : ''}
        ${dayOfWeek === 6 && day.isCurrentMonth ? 'text-blue-500' : ''}
      `}
    >
      <span className="leading-none">{day.date.getDate()}</span>
      {day.recordCount > 0 && day.isCurrentMonth && (
        <span className="text-[10px] text-gray-500 leading-none mt-0.5">
          {day.recordCount}
        </span>
      )}
    </button>
  );
};
