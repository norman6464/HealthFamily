import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Users, Pill, Clock, X } from 'lucide-react';
import { TodayScheduleViewModel } from '../../domain/usecases/GetTodaySchedules';
import { ScheduleEntity } from '../../domain/entities/Schedule';
import { MissedDoseIndicator } from './MissedDoseIndicator';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface TodayScheduleListProps {
  schedules: TodayScheduleViewModel[];
  isLoading: boolean;
  onMarkCompleted?: (scheduleId: string, options?: { takenAt?: string; notes?: string }) => void;
  hasMembers?: boolean;
}

export const TodayScheduleList: React.FC<TodayScheduleListProps> = ({ schedules, isLoading, onMarkCompleted, hasMembers }) => {
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  if (schedules.length === 0) {
    if (!hasMembers) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">はじめての方へ</p>
          <div className="space-y-3">
            <SetupStep icon={Users} label="メンバーを登録" href="/members" description="家族やペットを追加" step={1} />
            <SetupStep icon={Pill} label="お薬を登録" href="/medications" description="メンバーごとに薬を追加" step={2} />
            <SetupStep icon={Clock} label="スケジュールを設定" href="/medications" description="飲む時間と頻度を設定" step={3} />
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500 mb-3">今日の服薬スケジュールはありません</p>
        <Link
          href="/medications"
          className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <Pill size={14} />
          <span>お薬ページでスケジュールを確認</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <ScheduleCard
          key={schedule.scheduleId}
          schedule={schedule}
          onMarkCompleted={onMarkCompleted}
        />
      ))}
    </div>
  );
};

interface ScheduleCardProps {
  schedule: TodayScheduleViewModel;
  onMarkCompleted?: (scheduleId: string, options?: { takenAt?: string; notes?: string }) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = React.memo(({ schedule, onMarkCompleted }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [takenDate, setTakenDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overdueInfo = useMemo(() => {
    const now = new Date();
    const entity = new ScheduleEntity({
      id: schedule.scheduleId,
      medicationId: schedule.medicationId,
      userId: schedule.userId,
      memberId: schedule.memberId,
      scheduledTime: schedule.scheduledTime,
      daysOfWeek: [],
      isEnabled: schedule.isEnabled,
      reminderMinutesBefore: schedule.reminderMinutesBefore,
      createdAt: new Date(),
    });
    return {
      level: entity.getOverdueLevel(now, schedule.status === 'completed'),
      minutes: entity.getOverdueMinutes(now),
    };
  }, [schedule]);

  const overdueStyle = ScheduleEntity.getOverdueLevelStyle(overdueInfo.level);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCheckClick = () => {
    setTakenDate(todayStr);
    setNotes('');
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
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
      await onMarkCompleted(schedule.scheduleId, Object.keys(options).length > 0 ? options : undefined);
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border hover:shadow-lg transition-shadow ${
        overdueInfo.level !== 'none'
          ? `${overdueStyle.bg} ${overdueStyle.border}`
          : 'border-gray-200'
      }`}
      data-testid="schedule-item"
      role="article"
      aria-label={`${schedule.scheduledTime}の服薬スケジュール - ${schedule.medicationName}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center">
            <span
              className="text-2xl font-bold text-gray-800"
              data-testid="schedule-time"
            >
              {schedule.scheduledTime}
            </span>
            <MissedDoseIndicator
              overdueLevel={overdueInfo.level}
              overdueMinutes={overdueInfo.minutes}
            />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {schedule.memberName}
            </span>
            <span className="text-lg font-semibold text-gray-800">
              {schedule.medicationName}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onMarkCompleted && schedule.status !== 'completed' && (
            <button
              onClick={handleCheckClick}
              className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
              aria-label="服薬完了"
            >
              <Check size={18} />
            </button>
          )}
          <StatusBadge status={schedule.status} />
        </div>
      </div>

      {showConfirm && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">服薬記録</span>
            <button
              onClick={() => setShowConfirm(false)}
              className="p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="閉じる"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">服薬日</label>
              <input
                type="date"
                value={takenDate}
                max={todayStr}
                onChange={(e) => setTakenDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">メモ（任意）</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例: 飲み忘れ分"
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                maxLength={500}
              />
            </div>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || !takenDate}
              className="w-full flex items-center justify-center space-x-1 bg-green-600 text-white rounded-md py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              <span>{isSubmitting ? '記録中...' : takenDate !== todayStr ? `${takenDate.replace(/^\d{4}-/, '').replace('-', '/')}の服薬を記録` : '服薬を記録'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ScheduleCard.displayName = 'ScheduleCard';

interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'overdue';
}

const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status }) => {
  const styles = {
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: '未服薬',
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: '服薬済み',
    },
    overdue: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: '時間超過',
    },
  };

  const style = styles[status];

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}
      role="status"
      aria-label={`ステータス: ${style.label}`}
    >
      {style.label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

interface SetupStepProps {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  description: string;
  href: string;
  step: number;
}

const SetupStep: React.FC<SetupStepProps> = ({ icon: Icon, label, description, href, step }) => (
  <Link
    href={href}
    className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
  >
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
      {step}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-1.5">
        <Icon size={14} className="text-primary-600" />
        <span className="text-sm font-medium text-gray-800">{label}</span>
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </Link>
);
