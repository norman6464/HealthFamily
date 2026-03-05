import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HealthLogList } from '@/components/health-logs/HealthLogList';
import { DailyHealthLogGroup, ConditionLevel } from '@/domain/entities/HealthLog';

describe('HealthLogList', () => {
  const mockGroups: DailyHealthLogGroup[] = [
    {
      date: '2026-03-05',
      logs: [
        {
          id: 'log-1',
          memberId: 'member-1',
          memberName: 'テスト太郎',
          userId: 'user-1',
          conditionLevel: 4 as ConditionLevel,
          symptoms: ['headache', 'fatigue'],
          notes: 'テストメモ',
          recordedAt: new Date('2026-03-05T10:00:00'),
        },
        {
          id: 'log-2',
          memberId: 'member-1',
          memberName: 'テスト太郎',
          userId: 'user-1',
          conditionLevel: 2 as ConditionLevel,
          symptoms: [],
          recordedAt: new Date('2026-03-05T08:00:00'),
        },
      ],
    },
  ];

  it('読み込み中の表示をする', () => {
    render(<HealthLogList groups={[]} isLoading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('記録がない場合の空状態を表示する', () => {
    render(<HealthLogList groups={[]} isLoading={false} />);
    expect(screen.getByText('体調記録がありません')).toBeInTheDocument();
  });

  it('体調記録を日付ごとに表示する', () => {
    render(<HealthLogList groups={mockGroups} isLoading={false} />);
    expect(screen.getByText('良い')).toBeInTheDocument();
    expect(screen.getByText('悪い')).toBeInTheDocument();
    expect(screen.getAllByText('テスト太郎')).toHaveLength(2);
  });

  it('症状タグを表示する', () => {
    render(<HealthLogList groups={mockGroups} isLoading={false} />);
    expect(screen.getByText('頭痛')).toBeInTheDocument();
    expect(screen.getByText('倦怠感')).toBeInTheDocument();
  });

  it('メモを表示する', () => {
    render(<HealthLogList groups={mockGroups} isLoading={false} />);
    expect(screen.getByText('テストメモ')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const onDelete = vi.fn();
    render(<HealthLogList groups={mockGroups} isLoading={false} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByLabelText('削除');
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith('log-1');
  });

  it('onDeleteが未指定の場合は削除ボタンを表示しない', () => {
    render(<HealthLogList groups={mockGroups} isLoading={false} />);
    expect(screen.queryAllByLabelText('削除')).toHaveLength(0);
  });
});
