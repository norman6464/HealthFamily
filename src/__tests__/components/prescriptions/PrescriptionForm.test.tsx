import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrescriptionForm } from '@/components/prescriptions/PrescriptionForm';
import { Member } from '@/domain/entities/Member';

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  userId: 'user-1',
  name: '太郎',
  species: 'dog',
  breed: null,
  birthDate: null,
  iconType: 'dog',
  createdAt: new Date(),
  ...overrides,
});

describe('PrescriptionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const members = [createMember(), createMember({ id: 'member-2', name: '花子' })];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('全フォーム要素を表示する', () => {
    render(<PrescriptionForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('メンバー')).toBeInTheDocument();
    expect(screen.getByLabelText('処方箋名')).toBeInTheDocument();
    expect(screen.getByLabelText(/処方医/)).toBeInTheDocument();
    expect(screen.getByLabelText('処方日')).toBeInTheDocument();
    expect(screen.getByLabelText(/有効期限/)).toBeInTheDocument();
    expect(screen.getByLabelText(/薬局名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    expect(screen.getByText('登録する')).toBeInTheDocument();
  });

  it('メンバーが1人のみの場合は自動選択される', () => {
    render(<PrescriptionForm members={[createMember()]} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('メンバー') as HTMLSelectElement;
    expect(select.value).toBe('member-1');
  });

  it('必須項目が空の場合は送信しない', () => {
    render(<PrescriptionForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('フォームを正しく送信する', () => {
    render(<PrescriptionForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('処方箋名'), { target: { value: '高血圧治療薬' } });
    fireEvent.change(screen.getByLabelText('処方日'), { target: { value: '2025-12-01' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      memberId: 'member-1',
      prescriptionName: '高血圧治療薬',
      prescribedAt: '2025-12-01',
    }));
  });

  it('任意フィールドも送信に含まれる', () => {
    render(<PrescriptionForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('処方箋名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText(/処方医/), { target: { value: '山田医師' } });
    fireEvent.change(screen.getByLabelText(/薬局名/), { target: { value: 'テスト薬局' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      prescribedBy: '山田医師',
      pharmacyName: 'テスト薬局',
    }));
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    render(<PrescriptionForm members={members} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('onCancelが未指定の場合はキャンセルボタンを表示しない', () => {
    render(<PrescriptionForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.queryByText('キャンセル')).not.toBeInTheDocument();
  });

  it('initialDataがある場合は更新ボタンを表示する', () => {
    render(
      <PrescriptionForm
        members={members}
        onSubmit={mockOnSubmit}
        initialData={{
          memberId: 'member-1',
          prescriptionName: '抗生物質',
          prescribedAt: '2025-12-01',
          prescribedBy: '佐藤医師',
        }}
      />
    );
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.getByDisplayValue('抗生物質')).toBeInTheDocument();
    expect(screen.getByDisplayValue('佐藤医師')).toBeInTheDocument();
  });

  it('送信後にフォームがリセットされる（新規登録時）', () => {
    render(<PrescriptionForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('処方箋名'), { target: { value: 'テスト' } });
    fireEvent.click(screen.getByText('登録する'));
    expect((screen.getByLabelText('処方箋名') as HTMLInputElement).value).toBe('');
  });
});
