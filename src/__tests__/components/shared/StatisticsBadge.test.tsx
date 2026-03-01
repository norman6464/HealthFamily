import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatisticsBadge } from '@/components/shared/StatisticsBadge';

describe('StatisticsBadge', () => {
  it('ラベルと値を表示する', () => {
    render(<StatisticsBadge label="週間" value={85} unit="%" />);
    expect(screen.getByText('週間')).toBeInTheDocument();
    expect(screen.getByText(/85/)).toBeInTheDocument();
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it('文字列の値を表示する', () => {
    render(<StatisticsBadge label="残り" value="5日" />);
    expect(screen.getByText('残り')).toBeInTheDocument();
    expect(screen.getByText('5日')).toBeInTheDocument();
  });

  it('warningレベルのスタイルが適用される', () => {
    const { container } = render(<StatisticsBadge label="テスト" value={40} level="warning" />);
    expect(container.firstChild?.textContent).toContain('40');
  });

  it('criticalレベルのスタイルが適用される', () => {
    const { container } = render(<StatisticsBadge label="テスト" value={10} level="critical" />);
    const el = container.querySelector('[class*="red"]');
    expect(el).toBeInTheDocument();
  });

  it('デフォルトレベルはgoodである', () => {
    const { container } = render(<StatisticsBadge label="テスト" value={75} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
