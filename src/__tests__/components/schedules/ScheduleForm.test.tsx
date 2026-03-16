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
    expect(screen.getByText('頻度')).toBeInTheDocument();
    expect(screen.getByLabelText('リマインダー（分前）')).toBeInTheDocument();
    expect(screen.getByText('スケジュールを追加')).toBeInTheDocument();
  });

  it('毎日モードがデフォルトで選択されている', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    const dailyButton = screen.getByText('毎日');
    expect(dailyButton.className).toContain('bg-primary-600');
  });

  it('曜日指定モードに切り替えると曜日ボタンが表示される', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('曜日指定'));
    expect(screen.getByLabelText('月')).toBeInTheDocument();
    expect(screen.getByLabelText('火')).toBeInTheDocument();
    expect(screen.getByLabelText('水')).toBeInTheDocument();
    expect(screen.getByLabelText('木')).toBeInTheDocument();
    expect(screen.getByLabelText('金')).toBeInTheDocument();
    expect(screen.getByLabelText('土')).toBeInTheDocument();
    expect(screen.getByLabelText('日')).toBeInTheDocument();
  });

  it('毎日モードで送信すると空のdaysOfWeekで呼ばれる', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('スケジュールを追加'));
    expect(mockOnSubmit).toHaveBeenCalledWith({
      scheduledTime: '08:00',
      daysOfWeek: [],
      intervalDays: undefined,
      startDate: undefined,
      reminderMinutesBefore: 10,
    });
  });

  it('曜日指定モードで曜日を選択せずに送信するとonSubmitが呼ばれない', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('曜日指定'));
    fireEvent.click(screen.getByText('スケジュールを追加'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('曜日指定モードで曜日を選択して送信するとonSubmitが正しいデータで呼ばれる', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('曜日指定'));
    fireEvent.click(screen.getByLabelText('月'));
    fireEvent.click(screen.getByLabelText('水'));
    fireEvent.click(screen.getByText('スケジュールを追加'));
    expect(mockOnSubmit).toHaveBeenCalledWith({
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'wed'],
      intervalDays: undefined,
      startDate: undefined,
      reminderMinutesBefore: 10,
    });
  });

  it('曜日のトグルが正しく動作する', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('曜日指定'));
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

  it('送信後にフォームが毎日モードにリセットされる', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('スケジュールを追加'));
    const dailyButton = screen.getByText('毎日');
    expect(dailyButton.className).toContain('bg-primary-600');
  });

  it('間隔指定モードに切り替えると間隔選択と開始日が表示される', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('間隔指定'));
    expect(screen.getByLabelText('投与間隔')).toBeInTheDocument();
    expect(screen.getByLabelText('開始日（最初の投与日）')).toBeInTheDocument();
  });

  it('間隔指定モードで送信するとintervalDaysとstartDateが含まれる', () => {
    render(<ScheduleForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('間隔指定'));
    fireEvent.click(screen.getByText('スケジュールを追加'));
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduledTime: '08:00',
        daysOfWeek: [],
        intervalDays: 21,
        reminderMinutesBefore: 10,
      })
    );
    expect(mockOnSubmit.mock.calls[0][0].startDate).toBeTruthy();
  });
});
