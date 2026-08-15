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
      <label htmlFor={`time-${label}`} className="mb-1 block text-sm font-medium text-ink-700">
        {label}
      </label>
      <input
        id={`time-${label}`}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-xl border border-primary-200 px-3 py-2 text-sm disabled:bg-primary-50 disabled:text-ink-400"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
