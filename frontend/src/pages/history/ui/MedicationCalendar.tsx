import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HealthLog } from "@/shared/api";
import { toDateKey, type EnrichedRecord } from "@/entities/medication-record";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  recordCount: number;
  averageCondition: number | null;
}

const WEEKDAY_HEADERS = ["日", "月", "火", "水", "木", "金", "土"];

function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** 指定月のカレンダー（6週分）を生成 */
function generateMonth(year: number, month: number, today: Date): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const days: CalendarDay[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push({ date, isCurrentMonth: false, isToday: isSameDay(date, today), recordCount: 0, averageCondition: null });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({ date, isCurrentMonth: true, isToday: isSameDay(date, today), recordCount: 0, averageCondition: null });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({ date, isCurrentMonth: false, isToday: isSameDay(date, today), recordCount: 0, averageCondition: null });
  }
  return days;
}

function getMonthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}

function getRecordCountColor(count: number): string {
  if (count === 0) return "";
  if (count <= 2) return "bg-green-100";
  if (count <= 5) return "bg-green-200";
  return "bg-green-300";
}

interface MedicationCalendarProps {
  records: EnrichedRecord[];
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
    const baseDays = generateMonth(year, month, today);

    const recordCounts = new Map<string, number>();
    for (const record of records) {
      const key = toDateKey(record.takenAt);
      recordCounts.set(key, (recordCounts.get(key) || 0) + 1);
    }

    const conditionMap = new Map<string, number[]>();
    for (const log of healthLogs) {
      const key = toDateKey(new Date(log.recordedAt));
      if (!conditionMap.has(key)) conditionMap.set(key, []);
      conditionMap.get(key)!.push(log.conditionLevel);
    }

    return baseDays.map((day) => {
      const key = toDateKey(day.date);
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
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-primary-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 text-ink-500 hover:text-ink-700 transition-colors"
          aria-label="前月"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-base font-semibold text-ink-800">{getMonthLabel(year, month)}</h3>
        <button
          onClick={handleNextMonth}
          className="p-1 text-ink-500 hover:text-ink-700 transition-colors"
          aria-label="翌月"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_HEADERS.map((day, i) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-ink-500"
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
            isSelected={selectedDate === toDateKey(day.date)}
            onClick={() => onSelectDate(toDateKey(day.date))}
          />
        ))}
      </div>

      <div className="flex items-center justify-center space-x-4 mt-3 text-xs text-ink-500">
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
  const bgColor = getRecordCountColor(day.recordCount);
  const dayOfWeek = day.date.getDay();

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square flex flex-col items-center justify-center
        text-sm rounded-md transition-colors
        ${day.isCurrentMonth ? "text-ink-800" : "text-ink-300"}
        ${day.isToday ? "ring-2 ring-primary-500" : ""}
        ${isSelected ? "bg-primary-100 ring-2 ring-primary-600" : bgColor || "hover:bg-primary-50"}
        ${dayOfWeek === 0 && day.isCurrentMonth ? "text-red-500" : ""}
        ${dayOfWeek === 6 && day.isCurrentMonth ? "text-blue-500" : ""}
      `}
    >
      <span className="leading-none">{day.date.getDate()}</span>
      {day.recordCount > 0 && day.isCurrentMonth && (
        <span className="text-[10px] text-ink-500 leading-none mt-0.5">{day.recordCount}</span>
      )}
    </button>
  );
};
