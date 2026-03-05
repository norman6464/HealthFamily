import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthWeeklyTrend } from '@/components/health-logs/HealthWeeklyTrend';

describe('HealthWeeklyTrend', () => {
  const averages = [
    { date: '2026-02-27', dayLabel: '金', average: 3 },
    { date: '2026-02-28', dayLabel: '土', average: null },
    { date: '2026-03-01', dayLabel: '日', average: 4 },
    { date: '2026-03-02', dayLabel: '月', average: 2 },
    { date: '2026-03-03', dayLabel: '火', average: 5 },
    { date: '2026-03-04', dayLabel: '水', average: 3 },
    { date: '2026-03-05', dayLabel: '木', average: 4 },
  ];

  it('タイトルを表示する', () => {
    render(<HealthWeeklyTrend averages={averages} />);
    expect(screen.getByText('週間体調トレンド')).toBeInTheDocument();
  });

  it('各曜日ラベルを表示する', () => {
    render(<HealthWeeklyTrend averages={averages} />);
    expect(screen.getByText('金')).toBeInTheDocument();
    expect(screen.getByText('木')).toBeInTheDocument();
  });

  it('空配列の場合はnullを返す', () => {
    const { container } = render(<HealthWeeklyTrend averages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('全てnullの場合もバーを表示する', () => {
    const allNull = averages.map((a) => ({ ...a, average: null }));
    render(<HealthWeeklyTrend averages={allNull} />);
    expect(screen.getByText('週間体調トレンド')).toBeInTheDocument();
  });
});
