import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MiniCalendar } from '@/components/appointments/MiniCalendar';

describe('MiniCalendar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('月名を表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15));
    render(<MiniCalendar appointmentDates={[]} />);
    expect(screen.getByText('2026年3月')).toBeInTheDocument();
  });

  it('曜日ヘッダーを表示する', () => {
    render(<MiniCalendar appointmentDates={[]} />);
    expect(screen.getByText('月')).toBeInTheDocument();
    expect(screen.getByText('日')).toBeInTheDocument();
  });

  it('予約のある日にマーカーを表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15));
    const dates = [new Date(2026, 2, 20)];
    render(<MiniCalendar appointmentDates={dates} />);
    const day20 = screen.getByText('20');
    expect(day20.closest('button')?.querySelector('[data-testid="dot-marker"]')).toBeTruthy();
  });

  it('前月・次月ボタンで月が変わる', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15));
    render(<MiniCalendar appointmentDates={[]} />);
    expect(screen.getByText('2026年3月')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('次の月'));
    expect(screen.getByText('2026年4月')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('前の月'));
    expect(screen.getByText('2026年3月')).toBeInTheDocument();
  });

  it('今日の日付がハイライトされる', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15));
    render(<MiniCalendar appointmentDates={[]} />);
    const today = screen.getByText('15');
    expect(today.closest('button')?.className).toContain('bg-primary');
  });
});
