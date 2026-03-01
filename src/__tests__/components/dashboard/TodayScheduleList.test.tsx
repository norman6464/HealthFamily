import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodayScheduleList } from '@/components/dashboard/TodayScheduleList';
import { TodayScheduleViewModel } from '@/domain/usecases/GetTodaySchedules';

const createSchedule = (overrides: Partial<TodayScheduleViewModel> = {}): TodayScheduleViewModel => ({
  scheduleId: 'schedule-1',
  medicationId: 'med-1',
  medicationName: 'アスピリン',
  memberName: '太郎',
  scheduledTime: '08:00',
  status: 'pending' as const,
  ...overrides,
});

describe('TodayScheduleList', () => {
  it('ローディング中は読み込みメッセージを表示する', () => {
    render(<TodayScheduleList schedules={[]} isLoading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('スケジュールが空の場合はメッセージを表示する', () => {
    render(<TodayScheduleList schedules={[]} isLoading={false} />);
    expect(screen.getByText('今日の服薬スケジュールはありません')).toBeInTheDocument();
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

  it('服薬完了ボタンをクリックするとコールバックが呼ばれる', () => {
    const onMarkCompleted = vi.fn();
    render(
      <TodayScheduleList
        schedules={[createSchedule({ scheduleId: 's1', status: 'pending' })]}
        isLoading={false}
        onMarkCompleted={onMarkCompleted}
      />,
    );
    fireEvent.click(screen.getByLabelText('服薬完了'));
    expect(onMarkCompleted).toHaveBeenCalledWith('s1');
  });

  it('服薬済みの場合は完了ボタンが表示されない', () => {
    const onMarkCompleted = vi.fn();
    render(
      <TodayScheduleList
        schedules={[createSchedule({ status: 'completed' })]}
        isLoading={false}
        onMarkCompleted={onMarkCompleted}
      />,
    );
    expect(screen.queryByLabelText('服薬完了')).not.toBeInTheDocument();
  });
});
