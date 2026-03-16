import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrescriptionList } from '@/components/prescriptions/PrescriptionList';
import { Prescription } from '@/domain/entities/Prescription';

const createPrescription = (overrides: Partial<Prescription> = {}): Prescription => ({
  id: 'presc-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  prescriptionName: 'テスト処方箋',
  prescribedBy: '山田医師',
  prescribedAt: new Date('2025-12-01'),
  expiresAt: new Date('2026-12-01'),
  pharmacyName: 'テスト薬局',
  notes: '食後に服用',
  createdAt: new Date(),
  ...overrides,
});

describe('PrescriptionList', () => {
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('読み込み中を表示する', () => {
    render(<PrescriptionList prescriptions={[]} isLoading={true} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('空状態を表示する', () => {
    render(<PrescriptionList prescriptions={[]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('処方箋が登録されていません')).toBeInTheDocument();
  });

  it('処方箋情報を表示する', () => {
    const prescription = createPrescription();
    render(<PrescriptionList prescriptions={[prescription]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('テスト処方箋')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText(/山田医師/)).toBeInTheDocument();
    expect(screen.getByText(/テスト薬局/)).toBeInTheDocument();
    expect(screen.getByText('食後に服用')).toBeInTheDocument();
  });

  it('期限切れの処方箋にバッジを表示する', () => {
    const prescription = createPrescription({
      expiresAt: new Date('2020-01-01'),
    });
    render(<PrescriptionList prescriptions={[prescription]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('期限切れ')).toBeInTheDocument();
  });

  it('期限間近の処方箋にバッジを表示する', () => {
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 3);
    const prescription = createPrescription({
      expiresAt: nearFuture,
    });
    render(<PrescriptionList prescriptions={[prescription]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.getByText('期限間近')).toBeInTheDocument();
  });

  it('期限が十分先の処方箋にはバッジを表示しない', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);
    const prescription = createPrescription({
      expiresAt: farFuture,
    });
    render(<PrescriptionList prescriptions={[prescription]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    expect(screen.queryByText('期限切れ')).not.toBeInTheDocument();
    expect(screen.queryByText('期限間近')).not.toBeInTheDocument();
  });

  it('削除ボタンでonDeleteが呼ばれる', () => {
    const prescription = createPrescription();
    render(<PrescriptionList prescriptions={[prescription]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(screen.getByText(/削除しますか/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('確認'));
    expect(mockOnDelete).toHaveBeenCalledWith('presc-1');
  });

  it('編集ボタンで編集モードに切り替わる', () => {
    const prescription = createPrescription();
    render(<PrescriptionList prescriptions={[prescription]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(screen.getByDisplayValue('テスト処方箋')).toBeInTheDocument();
    expect(screen.getByDisplayValue('山田医師')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テスト薬局')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
  });

  it('編集キャンセルで元の表示に戻る', () => {
    const prescription = createPrescription();
    render(<PrescriptionList prescriptions={[prescription]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.getByText('テスト処方箋')).toBeInTheDocument();
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('編集保存でonUpdateが呼ばれる', async () => {
    const prescription = createPrescription();
    render(<PrescriptionList prescriptions={[prescription]} isLoading={false} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByLabelText('編集'));
    fireEvent.change(screen.getByDisplayValue('テスト処方箋'), { target: { value: '新しい処方箋' } });
    fireEvent.click(screen.getByText('保存'));
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('presc-1', expect.objectContaining({
        prescriptionName: '新しい処方箋',
      }));
    });
  });
});
