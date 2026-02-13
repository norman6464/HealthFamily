import React from 'react';
import { TodayScheduleItem } from '../../types/dashboard';

interface TodayScheduleListProps {
  schedules: TodayScheduleItem[];
  isLoading: boolean;
}

export const TodayScheduleList: React.FC<TodayScheduleListProps> = ({ schedules, isLoading }) => {
  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // 空状態
  if (schedules.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <p className="text-gray-500 text-lg">今日の服薬スケジュールはありません</p>
      </div>
    );
  }

  // 時刻順にソート
  const sortedSchedules = [...schedules].sort((a, b) => {
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  return (
    <div className="space-y-4">
      {sortedSchedules.map((schedule) => (
        <ScheduleCard key={schedule.scheduleId} schedule={schedule} />
      ))}
    </div>
  );
};

interface ScheduleCardProps {
  schedule: TodayScheduleItem;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
      data-testid="schedule-item"
      role="article"
      aria-label={`${schedule.scheduledTime}の服薬スケジュール - ${schedule.medicationName}`}
    >
      <div className="flex items-center justify-between">
        {/* 左側: 時刻とメンバー情報 */}
        <div className="flex items-center space-x-4">
          {/* 時刻 */}
          <div className="flex flex-col items-center">
            <span
              className="text-2xl font-bold text-gray-800"
              data-testid="schedule-time"
            >
              {schedule.scheduledTime}
            </span>
          </div>

          {/* メンバーアイコン */}
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

        {/* 右側: ステータスバッジ */}
        <StatusBadge status={schedule.status} />
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
        <span className="text-xl" role="img" aria-label="ペット">
          🐕
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
      data-testid="member-type-human"
      aria-label="人間"
    >
      <span className="text-xl" role="img" aria-label="人間">
        👤
      </span>
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
