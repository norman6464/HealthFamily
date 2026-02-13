import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodayScheduleList } from '../TodayScheduleList';
import { TodayScheduleViewModel } from '../../../domain/usecases/GetTodaySchedules';

// モックデータ（クリーンアーキテクチャのViewModel）
const mockSchedules: TodayScheduleViewModel[] = [
  {
    scheduleId: '1',
    medicationId: 'med-1',
    medicationName: '血圧の薬',
    userId: 'user-1',
    memberId: 'member-1',
    memberName: 'パパ',
    memberType: 'human',
    scheduledTime: '08:00',
    status: 'completed',
    isEnabled: true,
    reminderMinutesBefore: 10,
  },
  {
    scheduleId: '2',
    medicationId: 'med-2',
    medicationName: '胃薬',
    userId: 'user-1',
    memberId: 'member-2',
    memberName: 'ママ',
    memberType: 'human',
    scheduledTime: '12:00',
    status: 'pending',
    isEnabled: true,
    reminderMinutesBefore: 30,
  },
  {
    scheduleId: '3',
    medicationId: 'med-3',
    medicationName: 'フィラリア薬',
    userId: 'user-1',
    memberId: 'member-3',
    memberName: 'ポチ',
    memberType: 'pet',
    scheduledTime: '18:00',
    status: 'pending',
    isEnabled: true,
    reminderMinutesBefore: 15,
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

  it('服薬時刻順に表示される（ユースケースでソート済み）', () => {
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
    const overdueSchedule: TodayScheduleViewModel[] = [
      {
        ...mockSchedules[0],
        scheduledTime: '06:00',
        status: 'overdue',
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
