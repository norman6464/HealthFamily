import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakCard } from '@/components/dashboard/StreakCard';

describe('StreakCard', () => {
  it('ストリーク情報を表示する', () => {
    render(
      <StreakCard
        streak={{ current: 5, longest: 12, message: '良いスタート' }}
        isLoading={false}
      />,
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('日連続')).toBeInTheDocument();
    expect(screen.getByText('良いスタート')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('ローディング中はnullを返す', () => {
    const { container } = render(
      <StreakCard streak={null} isLoading={true} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('streakがnullの場合はnullを返す', () => {
    const { container } = render(
      <StreakCard streak={null} isLoading={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('連続0日の場合も正しく表示する', () => {
    render(
      <StreakCard
        streak={{ current: 0, longest: 8, message: '今日から始めよう' }}
        isLoading={false}
      />,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('今日から始めよう')).toBeInTheDocument();
  });

  it('最長記録ラベルを表示する', () => {
    render(
      <StreakCard
        streak={{ current: 3, longest: 15, message: '良いスタート' }}
        isLoading={false}
      />,
    );

    expect(screen.getByText('最長記録')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });
});
