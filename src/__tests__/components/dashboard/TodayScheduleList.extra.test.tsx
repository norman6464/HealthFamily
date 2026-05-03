import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodayScheduleList } from '@/components/dashboard/TodayScheduleList';
import { TodayScheduleViewModel } from '@/domain/usecases/GetTodaySchedules';

const createSchedule = (overrides: Partial<TodayScheduleViewModel> = {}): TodayScheduleViewModel => ({
  scheduleId: 'sch-1',
  medicationId: 'med-1',
  medicationName: 'テスト薬',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  memberType: 'human',
  scheduledTime: '08:00',
  status: 'pending',
  isEnabled: true,
  reminderMinutesBefore: 5,
  ...overrides,
});

describe('TodayScheduleList - 追加テスト', () => {
  it('服薬済みのスケジュールにはステータスバッジが表示される', () => {
    const schedules = [createSchedule({ status: 'completed' })];
    render(<TodayScheduleList schedules={schedules} isLoading={false} />);
    expect(screen.getByText('服薬済み')).toBeInTheDocument();
  });

  it('時間超過のスケジュールにはステータスバッジが表示される', () => {
    const schedules = [createSchedule({ status: 'overdue' })];
    render(<TodayScheduleList schedules={schedules} isLoading={false} />);
    expect(screen.getByText('時間超過')).toBeInTheDocument();
  });

  it('未服薬のスケジュールに詳細入力ボタンが表示される', () => {
    const onMarkCompleted = vi.fn().mockResolvedValue(undefined);
    const schedules = [createSchedule({ scheduleId: 'sch-1', status: 'pending' })];
    render(<TodayScheduleList schedules={schedules} isLoading={false} onMarkCompleted={onMarkCompleted} />);
    fireEvent.click(screen.getByLabelText('詳細入力'));
    // 確認パネルが開くことを確認
    expect(screen.getByText('服薬を記録')).toBeInTheDocument();
  });

  it('服薬済みのスケジュールには詳細入力ボタンが表示されない', () => {
    const schedules = [createSchedule({ status: 'completed' })];
    render(<TodayScheduleList schedules={schedules} isLoading={false} onMarkCompleted={vi.fn()} />);
    expect(screen.queryByLabelText('詳細入力')).not.toBeInTheDocument();
  });

  it('スケジュール時刻とメンバー名を表示する', () => {
    const schedules = [createSchedule({ scheduledTime: '09:30', memberName: '花子' })];
    render(<TodayScheduleList schedules={schedules} isLoading={false} />);
    expect(screen.getByText('09:30')).toBeInTheDocument();
    expect(screen.getByText('花子')).toBeInTheDocument();
  });

  it('onMarkCompletedが未指定の場合は詳細入力ボタンが表示されない', () => {
    const schedules = [createSchedule({ status: 'pending' })];
    render(<TodayScheduleList schedules={schedules} isLoading={false} />);
    expect(screen.queryByLabelText('詳細入力')).not.toBeInTheDocument();
  });
});
