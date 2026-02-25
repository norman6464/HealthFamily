import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationList } from '../MedicationList';
import { MedicationViewModel } from '../../../domain/usecases/ManageMedications';

const mockMedications: MedicationViewModel[] = [
  {
    medication: {
      id: 'med-1',
      memberId: 'member-1',
      userId: 'user-1',
      name: '血圧の薬',
      category: 'regular',
      dosage: '1錠',
      frequency: '1日1回',
      stockQuantity: 28,
      lowStockThreshold: 7,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    isLowStock: false,
    displayInfo: { name: '血圧の薬', categoryLabel: '常用薬', dosageInfo: '1錠 / 1日1回' },
  },
  {
    medication: {
      id: 'med-2',
      memberId: 'member-1',
      userId: 'user-1',
      name: '胃薬',
      category: 'regular',
      dosage: '1包',
      frequency: '1日3回',
      stockQuantity: 3,
      lowStockThreshold: 10,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    isLowStock: true,
    displayInfo: { name: '胃薬', categoryLabel: '常用薬', dosageInfo: '1包 / 1日3回' },
  },
];

describe('MedicationList', () => {
  it('薬一覧が正しく表示される', () => {
    render(<MedicationList medications={mockMedications} isLoading={false} onDelete={vi.fn()} />);

    expect(screen.getByText('血圧の薬')).toBeInTheDocument();
    expect(screen.getByText('胃薬')).toBeInTheDocument();
  });

  it('カテゴリラベルが表示される', () => {
    render(<MedicationList medications={mockMedications} isLoading={false} onDelete={vi.fn()} />);

    const labels = screen.getAllByText('常用薬');
    expect(labels).toHaveLength(2);
  });

  it('在庫が少ない薬に警告が表示される', () => {
    render(<MedicationList medications={mockMedications} isLoading={false} onDelete={vi.fn()} />);

    expect(screen.getByText('在庫少')).toBeInTheDocument();
  });

  it('空状態が正しく表示される', () => {
    render(<MedicationList medications={[]} isLoading={false} onDelete={vi.fn()} />);

    expect(screen.getByText('薬がまだ登録されていません')).toBeInTheDocument();
  });

  it('ローディング状態が正しく表示される', () => {
    render(<MedicationList medications={[]} isLoading={true} onDelete={vi.fn()} />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const onDelete = vi.fn();
    render(<MedicationList medications={mockMedications} isLoading={false} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: '削除' });
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith('med-1');
  });
});
