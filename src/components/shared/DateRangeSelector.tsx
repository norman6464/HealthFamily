'use client';

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}

export function DateRangeSelector({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div>
        <label htmlFor="start-date" className="mb-1 block text-sm font-medium text-gray-700">
          開始日
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <span className="mt-6 text-gray-400">〜</span>
      <div>
        <label htmlFor="end-date" className="mb-1 block text-sm font-medium text-gray-700">
          終了日
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
