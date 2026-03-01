'use client';

interface TimePickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function TimePickerInput({
  label,
  value,
  onChange,
  error,
  disabled = false,
}: TimePickerInputProps) {
  return (
    <div>
      <label htmlFor={`time-${label}`} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={`time-${label}`}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
