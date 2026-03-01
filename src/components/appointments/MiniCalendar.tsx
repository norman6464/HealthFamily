'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  appointmentDates: Date[];
}

const DAY_HEADERS = ['月', '火', '水', '木', '金', '土', '日'];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({ appointmentDates }) => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const hasAppointment = (day: number) =>
    appointmentDates.some((d) => isSameDay(d, new Date(viewYear, viewMonth, day)));

  const isToday = (day: number) =>
    isSameDay(today, new Date(viewYear, viewMonth, day));

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 text-gray-500 hover:text-gray-700" aria-label="前の月">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-700">{viewYear}年{viewMonth + 1}月</span>
        <button onClick={nextMonth} className="p-1 text-gray-500 hover:text-gray-700" aria-label="次の月">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-xs text-gray-400 py-1">{d}</div>
        ))}
        {days.map((day, i) => (
          <button
            key={i}
            disabled={day === null}
            className={`relative text-xs py-1 rounded ${
              day !== null && isToday(day)
                ? 'bg-primary-600 text-white font-bold'
                : day !== null
                  ? 'text-gray-700 hover:bg-gray-100'
                  : ''
            }`}
          >
            {day ?? ''}
            {day !== null && hasAppointment(day) && (
              <span
                data-testid="dot-marker"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
