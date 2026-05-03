import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodayScheduleList } from '@/components/dashboard/TodayScheduleList';
import { TodayScheduleViewModel } from '@/domain/usecases/GetTodaySchedules';

const createSchedule = (overrides: Partial<TodayScheduleViewModel> = {}): TodayScheduleViewModel => ({
  scheduleId: 'schedule-1',
  medicationId: 'med-1',
  medicationName: 'アスピリン',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  memberType: 'human',
  scheduledTime: '08:00',
  status: 'pending' as const,
  isEnabled: true,
  reminderMinutesBefore: 5,
  ...overrides,
});

describe('TodayScheduleList', () => {
  it('ローディング中は読み込みメッセージを表示する', () => {
    render(<TodayScheduleList schedules={[]} isLoading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('スケジュールが空でメンバーがいる場合はメッセージを表示する', () => {
    render(<TodayScheduleList schedules={[]} isLoading={false} hasMembers={true} />);
    expect(screen.getByText('今日の服薬スケジュールはありません')).toBeInTheDocument();
  });

  it('スケジュールが空でメンバーもいない場合はセットアップガイドを表示する', () => {
    render(<TodayScheduleList schedules={[]} isLoading={false} hasMembers={false} />);
    expect(screen.getByText('はじめての方へ')).toBeInTheDocument();
  });

  it('スケジュール一覧を表示する', () => {
    const schedules = [
      createSchedule({ scheduleId: 's1', medicationName: 'アスピリン', scheduledTime: '08:00' }),
      createSchedule({ scheduleId: 's2', medicationName: 'ビタミンC', scheduledTime: '12:00', memberName: '花子' }),
    ];
    render(<TodayScheduleList schedules={schedules} isLoading={false} />);
    expect(screen.getByText('アスピリン')).toBeInTheDocument();
    expect(screen.getByText('ビタミンC')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('花子')).toBeInTheDocument();
  });

  it('未服薬ステータスが表示される', () => {
    render(<TodayScheduleList schedules={[createSchedule({ status: 'pending' })]} isLoading={false} />);
    expect(screen.getByText('未服薬')).toBeInTheDocument();
  });

  it('服薬済みステータスが表示される', () => {
    render(<TodayScheduleList schedules={[createSchedule({ status: 'completed' })]} isLoading={false} />);
    expect(screen.getByText('服薬済み')).toBeInTheDocument();
  });

  it('時間超過ステータスが表示される', () => {
    render(<TodayScheduleList schedules={[createSchedule({ status: 'overdue' })]} isLoading={false} />);
    expect(screen.getByText('時間超過')).toBeInTheDocument();
  });

  it('詳細入力ボタンをクリックすると確認パネルが表示される', () => {
    const onMarkCompleted = vi.fn().mockResolvedValue(undefined);
    render(
      <TodayScheduleList
        schedules={[createSchedule({ scheduleId: 's1', status: 'pending' })]}
        isLoading={false}
        onMarkCompleted={onMarkCompleted}
      />,
    );
    fireEvent.click(screen.getByLabelText('詳細入力'));
    expect(screen.getByText('服薬を記録')).toBeInTheDocument();
  });

  it('服薬済みの場合は詳細入力ボタンが表示されない', () => {
    const onMarkCompleted = vi.fn();
    render(
      <TodayScheduleList
        schedules={[createSchedule({ status: 'completed' })]}
        isLoading={false}
        onMarkCompleted={onMarkCompleted}
      />,
    );
    expect(screen.queryByLabelText('詳細入力')).not.toBeInTheDocument();
  });

  it('onMarkMultipleCompletedが渡されると一括記録ボタンが表示される', async () => {
    const onMarkMultiple = vi.fn().mockResolvedValue(undefined);
    const schedules = [
      createSchedule({ scheduleId: 's1', status: 'pending' }),
      createSchedule({ scheduleId: 's2', medicationName: 'ビタミンC', status: 'pending' }),
    ];
    render(
      <TodayScheduleList
        schedules={schedules}
        isLoading={false}
        onMarkMultipleCompleted={onMarkMultiple}
      />,
    );
    const checkboxes = screen.getAllByLabelText('服薬済みとしてチェック');
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText('1件をまとめて服薬記録')).toBeInTheDocument();
  });
});
