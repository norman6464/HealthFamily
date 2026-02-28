import React from 'react';
import { Dog, User } from 'lucide-react';
import { TodayScheduleViewModel } from '../../domain/usecases/GetTodaySchedules';

interface TodayScheduleListProps {
  schedules: TodayScheduleViewModel[];
  isLoading: boolean;
  onMarkCompleted?: (scheduleId: string) => void;
}

export const TodayScheduleList: React.FC<TodayScheduleListProps> = ({ schedules, isLoading, onMarkCompleted }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <p className="text-gray-500 text-lg">今日の服薬スケジュールはありません</p>
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
  onMarkCompleted?: (scheduleId: string) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, onMarkCompleted }) => {
  const showCompleteButton = schedule.status !== 'completed';

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
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
          </div>

          <div className="flex items-center space-x-2">
            <MemberIcon memberType={schedule.memberType} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {schedule.memberName}
              </span>
              <span className="text-lg font-semibold text-gray-800">
                {schedule.medicationName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showCompleteButton && onMarkCompleted && (
            <button
              onClick={() => onMarkCompleted(schedule.scheduleId)}
              className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
              aria-label="飲んだ"
            >
              飲んだ
            </button>
          )}
          <StatusBadge status={schedule.status} />
        </div>
      </div>
    </div>
  );
};

interface MemberIconProps {
  memberType: 'human' | 'pet';
}

const MemberIcon: React.FC<MemberIconProps> = ({ memberType }) => {
  if (memberType === 'pet') {
    return (
      <div
        className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"
        data-testid="member-type-pet"
        aria-label="ペット"
      >
        <Dog size={22} className="text-amber-700" />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
      data-testid="member-type-human"
      aria-label="人間"
    >
      <User size={22} className="text-blue-700" />
    </div>
  );
};

interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'overdue';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
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
};
