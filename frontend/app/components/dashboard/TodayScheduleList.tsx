import React, { useMemo, useState, useCallback } from "react";
import { Link } from "react-router";
import { Check, Users, Pill, Clock, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  getOverdueLevel,
  getOverdueLevelStyle,
  getOverdueMinutes,
  type TodayScheduleViewModel,
} from "@/hooks/dashboard";
import { MissedDoseIndicator } from "./MissedDoseIndicator";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface TodayScheduleListProps {
  schedules: TodayScheduleViewModel[];
  isLoading: boolean;
  onMarkCompleted?: (
    scheduleId: string,
    options?: { takenAt?: string; notes?: string },
  ) => Promise<void>;
  onMarkMultipleCompleted?: (scheduleIds: string[]) => Promise<void>;
  hasMembers?: boolean;
}

export const TodayScheduleList: React.FC<TodayScheduleListProps> = ({
  schedules,
  isLoading,
  onMarkCompleted,
  onMarkMultipleCompleted,
  hasMembers,
}) => {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const pendingIds = useMemo(
    () => new Set(schedules.filter((s) => s.status !== "completed").map((s) => s.scheduleId)),
    [schedules],
  );

  const handleToggleCheck = useCallback((scheduleId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(scheduleId)) {
        next.delete(scheduleId);
      } else {
        next.add(scheduleId);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setCheckedIds((prev) => {
      if (prev.size === pendingIds.size) return new Set();
      return new Set(pendingIds);
    });
  }, [pendingIds]);

  const handleBulkSubmit = async () => {
    if (!onMarkMultipleCompleted || checkedIds.size === 0) return;
    setIsBulkSubmitting(true);
    try {
      await onMarkMultipleCompleted([...checkedIds]);
      setCheckedIds(new Set());
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (schedules.length === 0) {
    if (!hasMembers) {
      return (
        <div className="bg-white rounded-2xl border border-primary-100 p-6">
          <p className="text-sm font-medium text-ink-700 mb-4">はじめての方へ</p>
          <div className="space-y-3">
            <SetupStep icon={Users} label="メンバーを登録" to="/members" description="家族やペットを追加" step={1} />
            <SetupStep icon={Pill} label="お薬を登録" to="/medications" description="メンバーごとに薬を追加" step={2} />
            <SetupStep icon={Clock} label="スケジュールを設定" to="/medications" description="飲む時間と頻度を設定" step={3} />
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-2xl border border-primary-100 p-6 text-center">
        <p className="text-ink-500 mb-3">今日の服薬スケジュールはありません</p>
        <Link
          to="/medications"
          className="inline-flex items-center space-x-1 text-sm text-primary hover:text-primary-dark font-medium"
        >
          <Pill size={14} />
          <span>お薬ページでスケジュールを確認</span>
        </Link>
      </div>
    );
  }

  const pendingCount = pendingIds.size;
  const allChecked = checkedIds.size === pendingCount && pendingCount > 0;

  return (
    <div className="space-y-2">
      {pendingCount > 1 && onMarkMultipleCompleted && (
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs text-ink-500">{pendingCount}件が未服薬</span>
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-xs text-primary font-medium hover:underline"
          >
            {allChecked ? "すべて解除" : "すべて選択"}
          </button>
        </div>
      )}

      {schedules.map((schedule) => (
        <ScheduleCard
          key={schedule.scheduleId}
          schedule={schedule}
          isChecked={checkedIds.has(schedule.scheduleId)}
          onToggleCheck={handleToggleCheck}
          onMarkCompleted={onMarkCompleted}
          showCheckbox={!!onMarkMultipleCompleted && pendingCount > 0}
        />
      ))}

      {checkedIds.size > 0 && onMarkMultipleCompleted && (
        <div className="sticky bottom-20 z-10 pt-2">
          <button
            type="button"
            onClick={handleBulkSubmit}
            disabled={isBulkSubmitting}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white rounded-xl py-3 font-semibold shadow-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-60 transition-colors"
          >
            <Check size={18} />
            <span>{isBulkSubmitting ? "記録中..." : `${checkedIds.size}件をまとめて服薬記録`}</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface ScheduleCardProps {
  schedule: TodayScheduleViewModel;
  isChecked: boolean;
  onToggleCheck: (id: string) => void;
  onMarkCompleted?: (
    scheduleId: string,
    options?: { takenAt?: string; notes?: string },
  ) => Promise<void>;
  showCheckbox: boolean;
}

const ScheduleCard: React.FC<ScheduleCardProps> = React.memo(
  ({ schedule, isChecked, onToggleCheck, onMarkCompleted, showCheckbox }) => {
    const [showDetail, setShowDetail] = useState(false);
    const [takenDate, setTakenDate] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const overdueInfo = useMemo(() => {
      const now = new Date();
      return {
        level: getOverdueLevel(schedule.scheduledTime, now, schedule.status === "completed"),
        minutes: getOverdueMinutes(schedule.scheduledTime, now),
      };
    }, [schedule.scheduledTime, schedule.status]);

    const overdueStyle = getOverdueLevelStyle(overdueInfo.level);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const isPending = schedule.status !== "completed";

    const handleDetailOpen = () => {
      setTakenDate(todayStr);
      setNotes("");
      setShowDetail(true);
    };

    const handleDetailConfirm = async () => {
      if (!onMarkCompleted) return;
      setIsSubmitting(true);
      try {
        const options: { takenAt?: string; notes?: string } = {};
        if (takenDate && takenDate !== todayStr) {
          options.takenAt = new Date(`${takenDate}T${schedule.scheduledTime}:00`).toISOString();
        }
        if (notes.trim()) {
          options.notes = notes.trim();
        }
        await onMarkCompleted(
          schedule.scheduleId,
          Object.keys(options).length > 0 ? options : undefined,
        );
        setShowDetail(false);
      } finally {
        setIsSubmitting(false);
      }
    };

    const borderClass = isChecked
      ? "border-green-400 bg-green-50"
      : overdueInfo.level !== "none"
        ? `${overdueStyle.bg} ${overdueStyle.border}`
        : "border-primary-100 bg-white";

    return (
      <div
        className={`rounded-2xl shadow-sm p-4 border transition-all ${borderClass}`}
        data-testid="schedule-item"
        role="article"
        aria-label={`${schedule.scheduledTime}の服薬スケジュール - ${schedule.medicationName}`}
      >
        <div className="flex items-center gap-3">
          {showCheckbox && isPending && (
            <button
              type="button"
              onClick={() => onToggleCheck(schedule.scheduleId)}
              aria-label={isChecked ? "チェックを外す" : "服薬済みとしてチェック"}
              className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                isChecked
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-primary-200 bg-white hover:border-green-400"
              }`}
            >
              {isChecked && <Check size={14} />}
            </button>
          )}

          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-2xl font-bold text-ink-800" data-testid="schedule-time">
                  {schedule.scheduledTime}
                </span>
                <MissedDoseIndicator
                  overdueLevel={overdueInfo.level}
                  overdueMinutes={overdueInfo.minutes}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-ink-500">{schedule.memberName}</span>
                <span className="text-base font-semibold text-ink-800 truncate">
                  {schedule.medicationName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {isPending && onMarkCompleted && (
                <button
                  type="button"
                  onClick={showDetail ? () => setShowDetail(false) : handleDetailOpen}
                  className="flex items-center gap-0.5 text-xs text-ink-400 hover:text-ink-600 transition-colors"
                  aria-label="詳細入力"
                >
                  <span>詳細</span>
                  {showDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
              <StatusBadge status={schedule.status} />
            </div>
          </div>
        </div>

        {showDetail && isPending && (
          <div className="mt-3 pt-3 border-t border-primary-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-ink-600">服薬記録（詳細）</span>
              <button
                onClick={() => setShowDetail(false)}
                className="p-0.5 text-ink-400 hover:text-ink-600"
                aria-label="閉じる"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-ink-500 mb-0.5">服薬日</label>
                <input
                  type="date"
                  value={takenDate}
                  max={todayStr}
                  onChange={(e) => setTakenDate(e.target.value)}
                  className="w-full rounded-md border border-primary-200 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-500 mb-0.5">メモ（任意）</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="例: 飲み忘れ分"
                  className="w-full rounded-md border border-primary-200 px-2 py-1.5 text-sm"
                  maxLength={500}
                />
              </div>
              <button
                onClick={handleDetailConfirm}
                disabled={isSubmitting || !takenDate}
                className="w-full flex items-center justify-center space-x-1 bg-green-600 text-white rounded-md py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                <span>
                  {isSubmitting
                    ? "記録中..."
                    : takenDate !== todayStr
                      ? `${takenDate.replace(/^\d{4}-/, "").replace("-", "/")}の服薬を記録`
                      : "服薬を記録"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

ScheduleCard.displayName = "ScheduleCard";

interface StatusBadgeProps {
  status: "pending" | "completed" | "overdue";
}

const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status }) => {
  const styles = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "未服薬" },
    completed: { bg: "bg-green-100", text: "text-green-800", label: "服薬済み" },
    overdue: { bg: "bg-red-100", text: "text-red-800", label: "時間超過" },
  } as const;
  const style = styles[status];
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
      role="status"
      aria-label={`ステータス: ${style.label}`}
    >
      {style.label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

interface SetupStepProps {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  description: string;
  to: string;
  step: number;
}

const SetupStep: React.FC<SetupStepProps> = ({ icon: Icon, label, description, to, step }) => (
  <Link
    to={to}
    className="flex items-center space-x-3 p-3 rounded-2xl border border-primary-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
  >
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center text-xs font-bold">
      {step}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-1.5">
        <Icon size={14} className="text-primary" />
        <span className="text-sm font-medium text-ink-800">{label}</span>
      </div>
      <p className="text-xs text-ink-500 mt-0.5">{description}</p>
    </div>
  </Link>
);
