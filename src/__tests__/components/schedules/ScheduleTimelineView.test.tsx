import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleTimelineView, TimelineItem } from '@/components/schedules/ScheduleTimelineView';

const createItem = (overrides: Partial<TimelineItem> = {}): TimelineItem => ({
  id: 'item-1',
  time: '08:00',
  medicationName: 'テスト薬',
  memberName: '太郎',
  isCompleted: false,
  ...overrides,
});

describe('ScheduleTimelineView', () => {
  it('スケジュールがない場合にメッセージを表示する', () => {
    render(<ScheduleTimelineView items={[]} />);
    expect(screen.getByText('今日のスケジュールはありません')).toBeInTheDocument();
  });

  it('スケジュール項目を表示する', () => {
    const items = [createItem()];
    render(<ScheduleTimelineView items={items} />);
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('テスト薬')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
  });

  it('完了済みのスケジュールにチェックマークが表示される', () => {
    const items = [createItem({ isCompleted: true })];
    render(<ScheduleTimelineView items={items} />);
    expect(screen.getByLabelText('完了済み')).toBeInTheDocument();
  });

  it('時刻順に並ぶ', () => {
    const items = [
      createItem({ id: '2', time: '12:00', medicationName: '昼の薬' }),
      createItem({ id: '1', time: '08:00', medicationName: '朝の薬' }),
    ];
    render(<ScheduleTimelineView items={items} />);
    const texts = screen.getAllByText(/の薬/);
    expect(texts[0].textContent).toBe('朝の薬');
    expect(texts[1].textContent).toBe('昼の薬');
  });

  it('複数のスケジュールを表示する', () => {
    const items = [
      createItem({ id: '1', time: '08:00', medicationName: '薬A' }),
      createItem({ id: '2', time: '12:00', medicationName: '薬B' }),
      createItem({ id: '3', time: '20:00', medicationName: '薬C' }),
    ];
    render(<ScheduleTimelineView items={items} />);
    expect(screen.getByText('薬A')).toBeInTheDocument();
    expect(screen.getByText('薬B')).toBeInTheDocument();
    expect(screen.getByText('薬C')).toBeInTheDocument();
  });
});
