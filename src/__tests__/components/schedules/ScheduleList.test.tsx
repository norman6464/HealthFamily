import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleList } from '@/components/schedules/ScheduleList';
import { ScheduleWithDetails } from '@/domain/repositories/ScheduleRepository';
import { Schedule } from '@/domain/entities/Schedule';

const createSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'sch-1',
  medicationId: 'med-1',
  userId: 'user-1',
  memberId: 'member-1',
  scheduledTime: '08:00',
  daysOfWeek: ['mon', 'wed', 'fri'],
  isEnabled: true,
  reminderMinutesBefore: 10,
  createdAt: new Date(),
  ...overrides,
});

const createItem = (overrides: Partial<Schedule> = {}, details: Partial<ScheduleWithDetails> = {}): ScheduleWithDetails => ({
  schedule: createSchedule(overrides),
  medicationName: 'テスト薬',
  memberName: 'テスト太郎',
  ...details,
});

describe('ScheduleList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  it('読み込み中を表示する', () => {
    render(<ScheduleList schedules={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<ScheduleList schedules={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('スケジュールがありません')).toBeInTheDocument();
  });

  it('有効なスケジュールを表示する', () => {
    const schedules = [createItem()];
    render(<ScheduleList schedules={schedules} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('有効なスケジュール')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('月・水・金')).toBeInTheDocument();
  });

  it('無効なスケジュールを分けて表示する', () => {
    const schedules = [
      createItem({ id: 'sch-1', isEnabled: true }),
      createItem({ id: 'sch-2', isEnabled: false }),
    ];
    render(<ScheduleList schedules={schedules} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('有効なスケジュール')).toBeInTheDocument();
    expect(screen.getByText('無効なスケジュール')).toBeInTheDocument();
  });

  it('全曜日の場合毎日と表示する', () => {
    const schedules = [createItem({ daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] })];
    render(<ScheduleList schedules={schedules} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('毎日')).toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const schedules = [createItem()];
    render(<ScheduleList schedules={schedules} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(mockOnDelete).toHaveBeenCalledWith('sch-1');
  });

  it('有効/無効の切り替えでonUpdateが呼ばれる', () => {
    const schedules = [createItem()];
    render(<ScheduleList schedules={schedules} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByText('有効'));
    expect(mockOnUpdate).toHaveBeenCalledWith('sch-1', { isEnabled: false });
  });
});
