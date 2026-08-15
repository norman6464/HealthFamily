import React, { useState } from "react";

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type ScheduleMode = "daily" | "weekdays" | "interval" | "prn" | "twice_daily" | "three_daily";

export interface ScheduleFormData {
  scheduledTime: string;
  daysOfWeek: DayOfWeek[];
  intervalDays?: number;
  startDate?: string;
  reminderMinutesBefore: number;
}

interface ScheduleFormProps {
  onSubmit: (data: ScheduleFormData) => void;
  onSubmitMultiple?: (data: ScheduleFormData[]) => void;
}

const TWICE_DAILY_LABELS = ["朝", "夜"];
const THREE_DAILY_LABELS = ["朝", "昼", "夜"];

const DAY_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: "mon", label: "月" },
  { value: "tue", label: "火" },
  { value: "wed", label: "水" },
  { value: "thu", label: "木" },
  { value: "fri", label: "金" },
  { value: "sat", label: "土" },
  { value: "sun", label: "日" },
];

const INTERVAL_OPTIONS = [
  { value: 2, label: "2日毎" },
  { value: 3, label: "3日毎" },
  { value: 7, label: "1週間毎" },
  { value: 14, label: "2週間毎" },
  { value: 21, label: "3週間毎" },
  { value: 28, label: "4週間毎" },
  { value: 30, label: "1ヶ月毎" },
  { value: 60, label: "2ヶ月毎" },
  { value: 90, label: "3ヶ月毎" },
];

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSubmit, onSubmitMultiple }) => {
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [mode, setMode] = useState<ScheduleMode>("daily");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [intervalDays, setIntervalDays] = useState("21");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [reminderMinutes, setReminderMinutes] = useState("10");
  const [twiceTimes, setTwiceTimes] = useState<[string, string]>(["08:00", "20:00"]);
  const [threeTimes, setThreeTimes] = useState<[string, string, string]>([
    "08:00",
    "13:00",
    "20:00",
  ]);

  const handleModeChange = (m: ScheduleMode) => {
    setMode(m);
    setTwiceTimes(["08:00", "20:00"]);
    setThreeTimes(["08:00", "13:00", "20:00"]);
  };

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "weekdays" && selectedDays.length === 0) return;
    if (mode === "interval" && !startDate) return;

    const baseData = {
      daysOfWeek: mode === "weekdays" ? selectedDays : ([] as DayOfWeek[]),
      intervalDays:
        mode === "prn" ? -1 : mode === "interval" ? parseInt(intervalDays, 10) : undefined,
      startDate: mode === "interval" ? startDate : undefined,
      reminderMinutesBefore: mode === "prn" ? 0 : parseInt(reminderMinutes, 10) || 0,
    };

    if (mode === "twice_daily" || mode === "three_daily") {
      const times = mode === "twice_daily" ? twiceTimes : threeTimes;
      const items = times.map((time) => ({ ...baseData, scheduledTime: time }));
      if (onSubmitMultiple) {
        onSubmitMultiple(items);
      } else {
        items.forEach((item) => onSubmit(item));
      }
    } else {
      onSubmit({ ...baseData, scheduledTime: mode === "prn" ? "00:00" : scheduledTime });
    }

    setScheduledTime("08:00");
    setSelectedDays([]);
    setMode("daily");
    setReminderMinutes("10");
    setTwiceTimes(["08:00", "20:00"]);
    setThreeTimes(["08:00", "13:00", "20:00"]);
  };

  const modeButtonClass = (m: ScheduleMode) =>
    `flex items-center justify-center px-3 h-10 rounded-full cursor-pointer border-2 text-sm font-medium transition-colors ${
      mode === m
        ? "bg-primary-600 text-white border-primary-600"
        : "bg-white text-ink-600 border-primary-200 hover:border-primary-400"
    }`;

  const timeLabelClass =
    "inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-bold shrink-0";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className="block text-sm font-medium text-ink-700 mb-2">頻度</span>
        <div className="flex flex-wrap gap-2 mb-2">
          <button type="button" className={modeButtonClass("daily")} onClick={() => handleModeChange("daily")}>
            毎日
          </button>
          <button
            type="button"
            className={modeButtonClass("weekdays")}
            onClick={() => handleModeChange("weekdays")}
          >
            曜日指定
          </button>
          <button
            type="button"
            className={modeButtonClass("interval")}
            onClick={() => handleModeChange("interval")}
          >
            間隔指定
          </button>
          <button
            type="button"
            className={modeButtonClass("twice_daily")}
            onClick={() => handleModeChange("twice_daily")}
          >
            1日2回
          </button>
          <button
            type="button"
            className={modeButtonClass("three_daily")}
            onClick={() => handleModeChange("three_daily")}
          >
            1日3回
          </button>
          <button type="button" className={modeButtonClass("prn")} onClick={() => handleModeChange("prn")}>
            頓服
          </button>
        </div>

        {mode === "prn" && (
          <p className="text-xs text-ink-500 mt-1">
            症状がある時だけ服用する薬です。ホーム画面には表示されません。
          </p>
        )}
      </div>

      {mode !== "prn" && mode !== "twice_daily" && mode !== "three_daily" && (
        <div>
          <label htmlFor="schedule-time" className="block text-sm font-medium text-ink-700 mb-1">
            服薬時刻
          </label>
          <input
            id="schedule-time"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {mode !== "prn" && mode !== "twice_daily" && mode !== "three_daily" && (
        <div>
          {mode === "weekdays" && (
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer border-2 text-sm font-medium transition-colors ${
                    selectedDays.includes(value)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-ink-600 border-primary-200 hover:border-primary-400"
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

          {mode === "interval" && (
            <div className="space-y-3 mt-2">
              <div>
                <label htmlFor="interval-days" className="block text-xs text-ink-500 mb-1">
                  投与間隔
                </label>
                <select
                  id="interval-days"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  {INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="start-date" className="block text-xs text-ink-500 mb-1">
                  開始日（最初の投与日）
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  required
                />
              </div>
            </div>
          )}
        </div>
      )}

      {(mode === "twice_daily" || mode === "three_daily") && (
        <div>
          <span className="block text-sm font-medium text-ink-700 mb-2">服薬時刻</span>
          <div className="space-y-2">
            {(mode === "twice_daily" ? TWICE_DAILY_LABELS : THREE_DAILY_LABELS).map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span className={timeLabelClass}>{label}</span>
                <input
                  type="time"
                  value={mode === "twice_daily" ? twiceTimes[i] : threeTimes[i]}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (mode === "twice_daily") {
                      setTwiceTimes((prev) => {
                        const next = [...prev] as [string, string];
                        next[i] = val;
                        return next;
                      });
                    } else {
                      setThreeTimes((prev) => {
                        const next = [...prev] as [string, string, string];
                        next[i] = val;
                        return next;
                      });
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-2">
            {mode === "twice_daily" ? "2回分" : "3回分"}
            のスケジュールがまとめて登録されます。時刻は変更できます。
          </p>
        </div>
      )}

      {mode !== "prn" && (
        <div>
          <label htmlFor="reminder-minutes" className="block text-sm font-medium text-ink-700 mb-1">
            リマインダー（分前）
          </label>
          <select
            id="reminder-minutes"
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(e.target.value)}
            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="0">なし</option>
            <option value="5">5分前</option>
            <option value="10">10分前</option>
            <option value="15">15分前</option>
            <option value="30">30分前</option>
            <option value="60">1時間前</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
      >
        スケジュールを追加
      </button>
    </form>
  );
};
