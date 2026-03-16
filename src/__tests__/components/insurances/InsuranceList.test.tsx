import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InsuranceList } from '@/components/insurances/InsuranceList';
import { Insurance } from '@/domain/entities/Insurance';

const createInsurance = (overrides: Partial<Insurance> = {}): Insurance => ({
  id: 'ins-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  insuranceType: '国民健康保険',
  providerName: 'テスト保険会社',
  policyNumber: 'POL-12345',
  notes: '年1回更新',
  createdAt: new Date(),
  ...overrides,
});

describe('InsuranceList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<InsuranceList insurances={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<InsuranceList insurances={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('保険が登録されていません')).toBeInTheDocument();
  });

  it('保険情報を表示する', () => {
    const insurance = createInsurance();
    render(<InsuranceList insurances={[insurance]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('国民健康保険')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('テスト保険会社')).toBeInTheDocument();
    expect(screen.getByText(/POL-12345/)).toBeInTheDocument();
    expect(screen.getByText('年1回更新')).toBeInTheDocument();
  });

  it('削除ボタンで確認ダイアログが表示される', () => {
    const insurance = createInsurance();
    render(<InsuranceList insurances={[insurance]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(screen.getByText(/削除しますか/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('確認'));
    expect(mockOnDelete).toHaveBeenCalledWith('ins-1');
  });

  it('編集ボタンで編集モードに切り替わる', () => {
    const insurance = createInsurance();
    render(<InsuranceList insurances={[insurance]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(screen.getByDisplayValue('国民健康保険')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テスト保険会社')).toBeInTheDocument();
    expect(screen.getByDisplayValue('POL-12345')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('編集キャンセルで元の表示に戻る', () => {
    const insurance = createInsurance();
    render(<InsuranceList insurances={[insurance]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.getByText('国民健康保険')).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('編集保存でonUpdateが呼ばれる', async () => {
    const insurance = createInsurance();
    render(<InsuranceList insurances={[insurance]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.change(screen.getByDisplayValue('国民健康保険'), { target: { value: '社会保険' } });
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('ins-1', expect.objectContaining({
        insuranceType: '社会保険',
      }));
    });
  });

  it('複数の保険を表示する', () => {
    const insurances = [
      createInsurance({ id: 'i1', insuranceType: '国民健康保険' }),
      createInsurance({ id: 'i2', insuranceType: '生命保険' }),
    ];
    render(<InsuranceList insurances={insurances} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('国民健康保険')).toBeInTheDocument();
    expect(screen.getByText('生命保険')).toBeInTheDocument();
  });
});
