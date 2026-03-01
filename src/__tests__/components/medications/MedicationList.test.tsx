import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MedicationList } from '@/components/medications/MedicationList';
import { MedicationViewModel } from '@/domain/usecases/ManageMedications';

const createViewModel = (overrides: Partial<MedicationViewModel> = {}): MedicationViewModel => ({
  medication: {
    id: 'med-1',
    memberId: 'member-1',
    userId: 'user-1',
    name: 'テスト薬',
    category: 'regular',
    dosage: '1錠',
    frequency: '1日1回',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  isLowStock: false,
  displayInfo: { name: 'テスト薬', categoryLabel: '常用薬', dosageInfo: '1錠 / 1日1回' },
  ...overrides,
});

describe('MedicationList', () => {
  const mockOnDelete = vi.fn();
  const mockOnMarkTaken = vi.fn().mockResolvedValue(undefined);
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<MedicationList medications={[]} isLoading={true} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<MedicationList medications={[]} isLoading={false} onDelete={mockOnDelete} />);
    expect(screen.getByText('薬がまだ登録されていません')).toBeInTheDocument();
  });

  it('薬の情報を表示する', () => {
    const vm = createViewModel();
    render(<MedicationList medications={[vm]} isLoading={false} onDelete={mockOnDelete} />);
    expect(screen.getByText('テスト薬')).toBeInTheDocument();
    expect(screen.getByText('常用薬')).toBeInTheDocument();
  });

  it('在庫少バッジを表示する', () => {
    const vm = createViewModel({ isLowStock: true });
    render(<MedicationList medications={[vm]} isLoading={false} onDelete={mockOnDelete} />);
    expect(screen.getByText('在庫少')).toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const vm = createViewModel();
    render(<MedicationList medications={[vm]} isLoading={false} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(mockOnDelete).toHaveBeenCalledWith('med-1');
  });

  it('飲んだボタンで記録済みに変わる', async () => {
    const vm = createViewModel();
    render(<MedicationList medications={[vm]} isLoading={false} onDelete={mockOnDelete} onMarkTaken={mockOnMarkTaken} />);
    fireEvent.click(screen.getByLabelText('飲んだ'));
    await waitFor(() => {
      expect(screen.getByText('記録済み')).toBeInTheDocument();
    });
    expect(mockOnMarkTaken).toHaveBeenCalledWith('med-1');
  });

  it('編集ボタンでonEditが呼ばれる', () => {
    const vm = createViewModel();
    render(<MedicationList medications={[vm]} isLoading={false} onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(mockOnEdit).toHaveBeenCalledWith(vm.medication);
  });

  it('在庫数を表示する', () => {
    const vm = createViewModel({
      medication: {
        ...createViewModel().medication,
        stockQuantity: 30,
      },
    });
    render(<MedicationList medications={[vm]} isLoading={false} onDelete={mockOnDelete} />);
    expect(screen.getByText('在庫: 30日分')).toBeInTheDocument();
  });
});
