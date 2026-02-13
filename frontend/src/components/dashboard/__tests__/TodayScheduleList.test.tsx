import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodayScheduleList } from '../TodayScheduleList';

// モックデータ
const mockSchedules = [
  {
    scheduleId: '1',
    medicationId: 'med-1',
    medicationName: '血圧の薬',
    userId: 'user-1',
    memberId: 'member-1',
    memberName: 'パパ',
    memberType: 'human' as const,
    scheduledTime: '08:00',
    status: 'completed' as const,
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'] as const,
    isEnabled: true,
    reminderMinutesBefore: 10,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    scheduleId: '2',
    medicationId: 'med-2',
    medicationName: '胃薬',
    userId: 'user-1',
    memberId: 'member-2',
    memberName: 'ママ',
    memberType: 'human' as const,
    scheduledTime: '12:00',
    status: 'pending' as const,
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
    isEnabled: true,
    reminderMinutesBefore: 30,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    scheduleId: '3',
    medicationId: 'med-3',
    medicationName: 'フィラリア薬',
    userId: 'user-1',
    memberId: 'member-3',
    memberName: 'ポチ',
    memberType: 'pet' as const,
    scheduledTime: '18:00',
    status: 'pending' as const,
    daysOfWeek: ['mon', 'wed', 'fri'] as const,
    isEnabled: true,
    reminderMinutesBefore: 15,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

describe('TodayScheduleList', () => {
  it('今日のスケジュール一覧が正しく表示される', () => {
    render(<TodayScheduleList schedules={mockSchedules} isLoading={false} />);

    // スケジュールが3件表示される
    expect(screen.getByText('血圧の薬')).toBeInTheDocument();
    expect(screen.getByText('胃薬')).toBeInTheDocument();
    expect(screen.getByText('フィラリア薬')).toBeInTheDocument();

    // メンバー名が表示される
    expect(screen.getByText('パパ')).toBeInTheDocument();
    expect(screen.getByText('ママ')).toBeInTheDocument();
    expect(screen.getByText('ポチ')).toBeInTheDocument();

    // 時刻が表示される
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('服薬時刻順にソートされて表示される', () => {
    const { container } = render(<TodayScheduleList schedules={mockSchedules} isLoading={false} />);

    const scheduleItems = container.querySelectorAll('[data-testid="schedule-item"]');
    expect(scheduleItems).toHaveLength(3);

    // 時系列順（08:00 -> 12:00 -> 18:00）で表示されることを確認
    const times = Array.from(scheduleItems).map(item =>
      item.querySelector('[data-testid="schedule-time"]')?.textContent
    );
    expect(times).toEqual(['08:00', '12:00', '18:00']);
  });

  it('ステータスバッジが正しく表示される', () => {
    render(<TodayScheduleList schedules={mockSchedules} isLoading={false} />);

    // 服薬済みステータス
    expect(screen.getByText('服薬済み')).toBeInTheDocument();

    // 未服薬ステータス（2件）
    const pendingBadges = screen.getAllByText('未服薬');
    expect(pendingBadges).toHaveLength(2);
  });

  it('空状態が正しく表示される', () => {
    render(<TodayScheduleList schedules={[]} isLoading={false} />);

    expect(screen.getByText('今日の服薬スケジュールはありません')).toBeInTheDocument();
  });

  it('ローディング状態が正しく表示される', () => {
    render(<TodayScheduleList schedules={[]} isLoading={true} />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('時間超過のステータスが正しく表示される', () => {
    const overdueSchedule = [
      {
        ...mockSchedules[0],
        scheduledTime: '06:00',
        status: 'overdue' as const,
      },
    ];

    render(<TodayScheduleList schedules={overdueSchedule} isLoading={false} />);

    expect(screen.getByText('時間超過')).toBeInTheDocument();
  });

  it('ペットのアイコンが表示される', () => {
    render(<TodayScheduleList schedules={mockSchedules} isLoading={false} />);

    // ペット用のアイコンが表示される（data-testid で確認）
    const petIcons = screen.getAllByTestId('member-type-pet');
    expect(petIcons).toHaveLength(1);
  });

  it('人間のアイコンが表示される', () => {
    render(<TodayScheduleList schedules={mockSchedules} isLoading={false} />);

    // 人間用のアイコンが表示される
    const humanIcons = screen.getAllByTestId('member-type-human');
    expect(humanIcons).toHaveLength(2);
  });
});
