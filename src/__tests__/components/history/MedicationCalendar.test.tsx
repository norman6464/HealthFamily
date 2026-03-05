import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationCalendar } from '@/components/history/MedicationCalendar';
import { MedicationRecord } from '@/domain/entities/MedicationRecord';
import { HealthLog, ConditionLevel } from '@/domain/entities/HealthLog';

describe('MedicationCalendar', () => {
  const mockRecords: MedicationRecord[] = [
    {
      id: 'r1',
      memberId: 'm1',
      memberName: 'テスト太郎',
      medicationId: 'med1',
      medicationName: '薬A',
      userId: 'u1',
      takenAt: new Date('2026-03-05T10:00:00'),
    },
    {
      id: 'r2',
      memberId: 'm1',
      memberName: 'テスト太郎',
      medicationId: 'med2',
      medicationName: '薬B',
      userId: 'u1',
      takenAt: new Date('2026-03-05T14:00:00'),
    },
  ];

  const mockHealthLogs: HealthLog[] = [
    {
      id: 'h1',
      memberId: 'm1',
      memberName: 'テスト太郎',
      userId: 'u1',
      conditionLevel: 4 as ConditionLevel,
      symptoms: [],
      recordedAt: new Date('2026-03-05T10:00:00'),
    },
  ];

  const defaultProps = {
    records: mockRecords,
    healthLogs: mockHealthLogs,
    onSelectDate: vi.fn(),
    selectedDate: null,
  };

  it('月名を表示する', () => {
    render(<MedicationCalendar {...defaultProps} />);
    // 現在の月が表示される
    const now = new Date();
    const expectedLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('曜日ヘッダーを表示する', () => {
    render(<MedicationCalendar {...defaultProps} />);
    expect(screen.getByText('日')).toBeInTheDocument();
    expect(screen.getByText('月')).toBeInTheDocument();
    expect(screen.getByText('土')).toBeInTheDocument();
  });

  it('前月・翌月ボタンが表示される', () => {
    render(<MedicationCalendar {...defaultProps} />);
    expect(screen.getByLabelText('前月')).toBeInTheDocument();
    expect(screen.getByLabelText('翌月')).toBeInTheDocument();
  });

  it('前月ボタンをクリックすると月が変わる', () => {
    render(<MedicationCalendar {...defaultProps} />);
    const now = new Date();
    fireEvent.click(screen.getByLabelText('前月'));

    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const expectedLabel = `${prevYear}年${prevMonth}月`;
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('翌月ボタンをクリックすると月が変わる', () => {
    render(<MedicationCalendar {...defaultProps} />);
    const now = new Date();
    fireEvent.click(screen.getByLabelText('翌月'));

    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const expectedLabel = `${nextYear}年${nextMonth}月`;
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('日付をクリックするとonSelectDateが呼ばれる', () => {
    const onSelectDate = vi.fn();
    render(<MedicationCalendar {...defaultProps} onSelectDate={onSelectDate} />);

    // 1日目のボタンをクリック
    const dayButtons = screen.getAllByRole('button').filter((b) => !b.getAttribute('aria-label'));
    if (dayButtons.length > 0) {
      fireEvent.click(dayButtons[0]);
      expect(onSelectDate).toHaveBeenCalled();
    }
  });

  it('凡例が表示される', () => {
    render(<MedicationCalendar {...defaultProps} />);
    expect(screen.getByText('1-2件')).toBeInTheDocument();
    expect(screen.getByText('3-5件')).toBeInTheDocument();
    expect(screen.getByText('6件+')).toBeInTheDocument();
  });
});
