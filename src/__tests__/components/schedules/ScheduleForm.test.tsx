import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleForm } from '@/components/schedules/ScheduleForm';

describe('ScheduleForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('フォームフィールドが表示される', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('服薬時刻')).toBeInTheDocument();
    expect(screen.getByText('曜日')).toBeInTheDocument();
    expect(screen.getByLabelText('リマインダー（分前）')).toBeInTheDocument();
    expect(screen.getByText('スケジュールを追加')).toBeInTheDocument();
  });

  it('毎日ボタンがデフォルトで選択されている', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('毎日')).toBeChecked();
  });

  it('毎日を解除すると曜日ボタンが表示される', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByLabelText('毎日'));
    expect(screen.getByLabelText('月')).toBeInTheDocument();
    expect(screen.getByLabelText('火')).toBeInTheDocument();
    expect(screen.getByLabelText('水')).toBeInTheDocument();
    expect(screen.getByLabelText('木')).toBeInTheDocument();
    expect(screen.getByLabelText('金')).toBeInTheDocument();
    expect(screen.getByLabelText('土')).toBeInTheDocument();
    expect(screen.getByLabelText('日')).toBeInTheDocument();
  });

  it('毎日選択時に送信すると空のdaysOfWeekで呼ばれる', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('スケジュールを追加'));
    expect(mockOnSubmit).toHaveBeenCalledWith({
      scheduledTime: '08:00',
      daysOfWeek: [],
      reminderMinutesBefore: 10,
    });
  });

  it('曜日を選択せずに送信するとonSubmitが呼ばれない', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByLabelText('毎日'));
    fireEvent.click(screen.getByText('スケジュールを追加'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('曜日を選択して送信するとonSubmitが正しいデータで呼ばれる', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByLabelText('毎日'));
    fireEvent.click(screen.getByLabelText('月'));
    fireEvent.click(screen.getByLabelText('水'));
    fireEvent.click(screen.getByText('スケジュールを追加'));
    expect(mockOnSubmit).toHaveBeenCalledWith({
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'wed'],
      reminderMinutesBefore: 10,
    });
  });

  it('曜日のトグルが正しく動作する', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByLabelText('毎日'));
    const mondayCheckbox = screen.getByLabelText('月');
    fireEvent.click(mondayCheckbox);
    expect(mondayCheckbox).toBeChecked();
    fireEvent.click(mondayCheckbox);
    expect(mondayCheckbox).not.toBeChecked();
  });

  it('リマインダーの選択肢が正しい', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('リマインダー（分前）');
    expect(select).toHaveValue('10');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(6);
  });

  it('送信後にフォームがリセットされる', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('スケジュールを追加'));
    expect(screen.getByLabelText('毎日')).toBeChecked();
  });
});
