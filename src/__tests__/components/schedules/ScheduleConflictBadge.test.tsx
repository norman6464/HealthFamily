import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleConflictBadge } from '@/components/schedules/ScheduleConflictBadge';

describe('ScheduleConflictBadge', () => {
  it('競合がない場合は何も表示しない', () => {
    const { container } = render(<ScheduleConflictBadge conflictCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('競合がある場合にバッジを表示する', () => {
    render(<ScheduleConflictBadge conflictCount={2} />);
    expect(screen.getByText(/2件/)).toBeInTheDocument();
  });

  it('競合メッセージを表示する', () => {
    render(<ScheduleConflictBadge conflictCount={1} message="同時刻に別のスケジュールがあります" />);
    expect(screen.getByText('同時刻に別のスケジュールがあります')).toBeInTheDocument();
  });

  it('警告アイコンが表示される', () => {
    const { container } = render(<ScheduleConflictBadge conflictCount={3} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('デフォルトメッセージが表示される', () => {
    render(<ScheduleConflictBadge conflictCount={2} />);
    expect(screen.getByText(/重複/)).toBeInTheDocument();
  });
});
