import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationHistoryList } from '@/components/history/MedicationHistoryList';
import { DailyRecordGroup } from '@/domain/entities/MedicationRecord';

const mockGroups: DailyRecordGroup[] = [
  {
    date: '2025-06-15',
    records: [
      {
        id: 'r1', memberId: 'm1', memberName: '太郎', medicationId: 'med1',
        medicationName: '頭痛薬', userId: 'u1', takenAt: new Date('2025-06-15T08:30:00'),
        dosageAmount: '1錠',
      },
      {
        id: 'r2', memberId: 'm1', memberName: '太郎', medicationId: 'med2',
        medicationName: '胃薬', userId: 'u1', takenAt: new Date('2025-06-15T12:00:00'),
        notes: '食後に服用',
      },
    ],
  },
];

describe('MedicationHistoryList', () => {
  it('読み込み中の表示', () => {
    render(<MedicationHistoryList groups={[]} isLoading={true} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空の場合のメッセージ表示', () => {
    render(<MedicationHistoryList groups={[]} isLoading={false} />);
    expect(screen.getByText('服薬履歴がありません')).toBeInTheDocument();
  });

  it('薬名が表示される', () => {
    render(<MedicationHistoryList groups={mockGroups} isLoading={false} />);
    expect(screen.getByText('頭痛薬')).toBeInTheDocument();
    expect(screen.getByText('胃薬')).toBeInTheDocument();
  });

  it('メンバー名が表示される', () => {
    render(<MedicationHistoryList groups={mockGroups} isLoading={false} />);
    expect(screen.getAllByText('太郎').length).toBeGreaterThan(0);
  });

  it('服用量が表示される', () => {
    render(<MedicationHistoryList groups={mockGroups} isLoading={false} />);
    expect(screen.getByText('1錠')).toBeInTheDocument();
  });

  it('メモが表示される', () => {
    render(<MedicationHistoryList groups={mockGroups} isLoading={false} />);
    expect(screen.getByText('食後に服用')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const onDelete = vi.fn();
    render(<MedicationHistoryList groups={mockGroups} isLoading={false} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByLabelText('削除');
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith('r1');
  });

  it('onDeleteが未指定の場合は削除ボタンが表示されない', () => {
    render(<MedicationHistoryList groups={mockGroups} isLoading={false} />);
    expect(screen.queryByLabelText('削除')).not.toBeInTheDocument();
  });
});
