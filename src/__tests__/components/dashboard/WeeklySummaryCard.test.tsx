import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard';
import { TodayScheduleViewModel } from '@/domain/usecases/GetTodaySchedules';

const createSchedule = (status: 'pending' | 'completed' | 'overdue'): TodayScheduleViewModel => ({
  scheduleId: `s-${Math.random()}`,
  medicationId: 'med-1',
  medicationName: 'テスト薬',
  memberName: '太郎',
  memberId: 'member-1',
  scheduledTime: '08:00',
  status,
});

describe('WeeklySummaryCard', () => {
  it('ローディング中はメッセージを表示する', () => {
    render(<WeeklySummaryCard schedules={[]} isLoading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('スケジュールが空の場合は何も表示しない', () => {
    const { container } = render(<WeeklySummaryCard schedules={[]} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('完了件数を表示する', () => {
    const schedules = [createSchedule('completed'), createSchedule('completed'), createSchedule('pending')];
    render(<WeeklySummaryCard schedules={schedules} isLoading={false} />);
    expect(screen.getByText('2件完了')).toBeInTheDocument();
  });

  it('予定件数を表示する', () => {
    const schedules = [createSchedule('pending'), createSchedule('completed')];
    render(<WeeklySummaryCard schedules={schedules} isLoading={false} />);
    expect(screen.getByText('1件予定')).toBeInTheDocument();
  });

  it('超過件数がある場合は表示する', () => {
    const schedules = [createSchedule('overdue'), createSchedule('completed')];
    render(<WeeklySummaryCard schedules={schedules} isLoading={false} />);
    expect(screen.getByText('1件超過')).toBeInTheDocument();
  });

  it('超過件数がない場合は非表示', () => {
    const schedules = [createSchedule('completed'), createSchedule('pending')];
    render(<WeeklySummaryCard schedules={schedules} isLoading={false} />);
    expect(screen.queryByText(/件超過/)).not.toBeInTheDocument();
  });

  it('達成率を表示する', () => {
    const schedules = [createSchedule('completed'), createSchedule('completed'), createSchedule('pending'), createSchedule('pending')];
    render(<WeeklySummaryCard schedules={schedules} isLoading={false} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
