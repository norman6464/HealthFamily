import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyDoseProgress } from '@/components/dashboard/DailyDoseProgress';

describe('DailyDoseProgress', () => {
  it('進捗を表示する', () => {
    render(<DailyDoseProgress taken={2} total={5} />);
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('0件の場合に予定なしを表示する', () => {
    render(<DailyDoseProgress taken={0} total={0} />);
    expect(screen.getByText('今日の予定なし')).toBeInTheDocument();
  });

  it('全完了時に完了メッセージを表示する', () => {
    render(<DailyDoseProgress taken={3} total={3} />);
    expect(screen.getByText('全て完了')).toBeInTheDocument();
  });

  it('ラベルを表示する', () => {
    render(<DailyDoseProgress taken={1} total={4} />);
    expect(screen.getByText('今日の服薬')).toBeInTheDocument();
  });

  it('プログレスバーが表示される', () => {
    render(<DailyDoseProgress taken={2} total={4} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
