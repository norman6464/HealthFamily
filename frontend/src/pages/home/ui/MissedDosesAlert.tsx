import React, { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Loader2 } from "lucide-react";
import type { MissedDose } from "../model/dashboard";

interface MissedDosesAlertProps {
  missedDoses: MissedDose[];
  isLoading: boolean;
  onMarkAsTaken?: (dose: MissedDose) => Promise<void>;
  onMarkMultipleAsTaken?: (doses: MissedDose[]) => Promise<void>;
}

interface DateGroup {
  date: string;
  dateLabel: string;
  items: MissedDose[];
}

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dateKey;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return dateKey;
  const dow = DAY_LABELS[date.getDay()] ?? "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return `昨日（${m}/${d} ${dow}）`;
  if (diffDays === 2) return `一昨日（${m}/${d} ${dow}）`;
  return `${m}月${d}日（${dow}）`;
}

export const MissedDosesAlert: React.FC<MissedDosesAlertProps> = ({
  missedDoses,
  isLoading,
  onMarkAsTaken,
  onMarkMultipleAsTaken,
}) => {
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [bulkTarget, setBulkTarget] = useState<string | null>(null);
  // null = 初期状態（最新日のみ開く）。ユーザーが操作したら Set で明示管理する。
  const [openDates, setOpenDates] = useState<Set<string> | null>(null);

  const dateGroups = useMemo(() => {
    if (missedDoses.length === 0) return [];
    const map = new Map<string, MissedDose[]>();
    for (const dose of missedDoses) {
      const group = map.get(dose.date) || [];
      group.push(dose);
      map.set(dose.date, group);
    }
    const groups: DateGroup[] = [];
    for (const [date, items] of map) {
      groups.push({ date, dateLabel: formatDateLabel(date), items });
    }
    groups.sort((a, b) => b.date.localeCompare(a.date));
    return groups;
  }, [missedDoses]);

  // 初期表示は「最新の日付だけ開く」。大量の飲み忘れで画面が埋まらないようにする。
  const defaultOpen = useMemo(
    () => new Set(dateGroups[0] ? [dateGroups[0].date] : []),
    [dateGroups],
  );
  const open = openDates ?? defaultOpen;
  const allOpen = dateGroups.length > 0 && dateGroups.every((g) => open.has(g.date));

  if (isLoading || missedDoses.length === 0) return null;

  const toggleDate = (date: string) => {
    setOpenDates((prev) => {
      const next = new Set(prev ?? defaultOpen);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const toggleAll = () => {
    setOpenDates(allOpen ? new Set() : new Set(dateGroups.map((g) => g.date)));
  };

  const handleMarkOne = async (dose: MissedDose) => {
    if (!onMarkAsTaken) return;
    const key = `${dose.date}-${dose.scheduleId}`;
    setRecordingId(key);
    try {
      await onMarkAsTaken(dose);
    } finally {
      setRecordingId(null);
    }
  };

  const handleMarkAllForDate = async (group: DateGroup) => {
    if (!onMarkMultipleAsTaken) return;
    setBulkTarget(group.date);
    try {
      await onMarkMultipleAsTaken(group.items);
    } finally {
      setBulkTarget(null);
    }
  };

  const handleMarkAll = async () => {
    if (!onMarkMultipleAsTaken) return;
    setBulkTarget("all");
    try {
      await onMarkMultipleAsTaken(missedDoses);
    } finally {
      setBulkTarget(null);
    }
  };

  const busy = bulkTarget !== null || recordingId !== null;

  return (
    <div className="mb-4">
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden">
        {/* ヘッダー: 件数サマリ + 全て記録 */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-red-800 leading-tight">飲み忘れがあります</h3>
              <p className="text-xs text-red-600/80 leading-tight">
                {missedDoses.length}件 ・ {dateGroups.length}日分
              </p>
            </div>
          </div>
          {onMarkMultipleAsTaken && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={busy}
              className="flex items-center gap-1 text-xs text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg font-medium flex-shrink-0 transition-colors"
            >
              {bulkTarget === "all" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              <span>全て記録</span>
            </button>
          )}
        </div>

        {/* 全展開トグル（2日分以上のときだけ） */}
        {dateGroups.length > 1 && (
          <div className="flex justify-end px-4 pt-2">
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              {allOpen ? "すべて折りたたむ" : "すべて開く"}
            </button>
          </div>
        )}

        {/* 日付ごとのアコーディオン */}
        <div className="divide-y divide-red-100/70">
          {dateGroups.map((group) => {
            const isOpen = open.has(group.date);
            return (
              <div key={group.date}>
                <button
                  type="button"
                  onClick={() => toggleDate(group.date)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-red-50/50 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <ChevronDown
                      size={16}
                      className={`text-red-400 flex-shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                    />
                    <span className="text-sm font-semibold text-red-700 truncate">
                      {group.dateLabel}
                    </span>
                    <span className="flex-shrink-0 text-[11px] font-semibold text-red-700 bg-red-100 rounded-full px-1.5 py-0.5">
                      {group.items.length}件
                    </span>
                  </span>
                  {onMarkMultipleAsTaken && group.items.length > 1 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllForDate(group);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkAllForDate(group);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium flex-shrink-0"
                    >
                      {bulkTarget === group.date ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : null}
                      <span>この日全て記録</span>
                    </span>
                  )}
                </button>

                {isOpen && (
                  <ul className="px-4 pb-3 pt-0.5 space-y-1">
                    {group.items.map((dose) => {
                      const key = `${dose.date}-${dose.scheduleId}`;
                      const isRecording = recordingId === key;
                      return (
                        <li
                          key={key}
                          className="flex items-center justify-between gap-2 text-sm bg-red-50/40 rounded-lg px-2.5 py-1.5"
                        >
                          <span className="text-ink-800 min-w-0 truncate">
                            <span className="text-ink-500">{dose.memberName}</span>{" "}
                            <span className="font-medium">{dose.medicationName}</span>
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-ink-500 tabular-nums">
                              {dose.scheduledTime}
                            </span>
                            {onMarkAsTaken && (
                              <button
                                type="button"
                                onClick={() => handleMarkOne(dose)}
                                disabled={isRecording || bulkTarget !== null}
                                aria-label="記録する"
                                className="flex items-center gap-1 text-xs text-red-700 hover:text-white hover:bg-red-600 disabled:opacity-50 border border-red-300 hover:border-red-600 px-2 py-0.5 rounded-md transition-colors"
                              >
                                {isRecording ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <Check size={11} />
                                )}
                                <span>記録</span>
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
