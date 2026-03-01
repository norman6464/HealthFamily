'use client';

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'] as const;

interface WeekdaySelectorProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
  disabled?: boolean;
}

export function WeekdaySelector({
  selectedDays,
  onChange,
  disabled = false,
}: WeekdaySelectorProps) {
  const handleToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="flex gap-2">
      {WEEKDAYS.map((day) => (
        <label
          key={day}
          className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-1.5 text-sm transition-colors ${
            selectedDays.includes(day)
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <input
            type="checkbox"
            checked={selectedDays.includes(day)}
            onChange={() => handleToggle(day)}
            disabled={disabled}
            className="sr-only"
          />
          {day}
        </label>
      ))}
    </div>
  );
}
