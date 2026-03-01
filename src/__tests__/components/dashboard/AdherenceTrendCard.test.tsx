import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdherenceTrendCard } from '@/components/dashboard/AdherenceTrendCard';
import { AdherenceTrend } from '@/domain/entities/AdherenceTrend';

const createTrend = (overrides: Partial<AdherenceTrend> = {}): AdherenceTrend => ({
  dayOfWeekStats: [
    { day: 0, dayLabel: '日', count: 1, expected: 2, rate: 50 },
    { day: 1, dayLabel: '月', count: 2, expected: 2, rate: 100 },
    { day: 2, dayLabel: '火', count: 2, expected: 2, rate: 100 },
    { day: 3, dayLabel: '水', count: 1, expected: 2, rate: 50 },
    { day: 4, dayLabel: '木', count: 2, expected: 2, rate: 100 },
    { day: 5, dayLabel: '金', count: 2, expected: 2, rate: 100 },
    { day: 6, dayLabel: '土', count: 1, expected: 2, rate: 50 },
  ],
  bestDay: '月',
  worstDay: '日',
  previousPeriodRate: 70,
  currentPeriodRate: 80,
  rateChange: 10,
  ...overrides,
});

describe('AdherenceTrendCard', () => {
  it('ローディング中はメッセージを表示する', () => {
    render(<AdherenceTrendCard trend={null} isLoading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('トレンドがnullの場合は何も表示しない', () => {
    const { container } = render(<AdherenceTrendCard trend={null} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('タイトルを表示する', () => {
    render(<AdherenceTrendCard trend={createTrend()} isLoading={false} />);
    expect(screen.getByText('服薬トレンド（週間）')).toBeInTheDocument();
  });

  it('変化率を表示する', () => {
    render(<AdherenceTrendCard trend={createTrend({ rateChange: 10 })} isLoading={false} />);
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });

  it('最高・最低の曜日を表示する', () => {
    render(<AdherenceTrendCard trend={createTrend({ bestDay: '月', worstDay: '日' })} isLoading={false} />);
    expect(screen.getByText('最高: 月曜日')).toBeInTheDocument();
    expect(screen.getByText('最低: 日曜日')).toBeInTheDocument();
  });

  it('全曜日ラベルを表示する', () => {
    render(<AdherenceTrendCard trend={createTrend()} isLoading={false} />);
    expect(screen.getByText('日')).toBeInTheDocument();
    expect(screen.getByText('月')).toBeInTheDocument();
    expect(screen.getByText('土')).toBeInTheDocument();
  });
});
