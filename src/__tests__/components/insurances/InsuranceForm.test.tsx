import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InsuranceForm } from '@/components/insurances/InsuranceForm';
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

describe('InsuranceForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const members = [createMember(), createMember({ id: 'member-2', name: '花子' })];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('全フォーム要素を表示する', () => {
    render(<InsuranceForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('メンバー')).toBeInTheDocument();
    expect(screen.getByLabelText('保険の種類')).toBeInTheDocument();
    expect(screen.getByLabelText(/保険会社名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/証券番号/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    expect(screen.getByText('登録する')).toBeInTheDocument();
  });

  it('メンバーが1人のみの場合は自動選択される', () => {
    render(<InsuranceForm members={[createMember()]} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('メンバー') as HTMLSelectElement;
    expect(select.value).toBe('member-1');
  });

  it('必須項目が空の場合は送信しない', () => {
    render(<InsuranceForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('フォームを正しく送信する', () => {
    render(<InsuranceForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('保険の種類'), { target: { value: '国民健康保険' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      memberId: 'member-1',
      insuranceType: '国民健康保険',
    }));
  });

  it('任意フィールドも送信に含まれる', () => {
    render(<InsuranceForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('保険の種類'), { target: { value: '生命保険' } });
    fireEvent.change(screen.getByLabelText(/保険会社名/), { target: { value: 'テスト保険会社' } });
    fireEvent.change(screen.getByLabelText(/証券番号/), { target: { value: 'POL-123' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      providerName: 'テスト保険会社',
      policyNumber: 'POL-123',
    }));
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    render(<InsuranceForm members={members} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('initialDataがある場合は更新ボタンを表示する', () => {
    render(
      <InsuranceForm
        members={members}
        onSubmit={mockOnSubmit}
        initialData={{
          memberId: 'member-1',
          insuranceType: '医療保険',
          providerName: 'ABC保険',
          policyNumber: 'POL-999',
        }}
      />
    );
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.getByDisplayValue('医療保険')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ABC保険')).toBeInTheDocument();
  });

  it('送信後にフォームがリセットされる（新規登録時）', () => {
    render(<InsuranceForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('保険の種類'), { target: { value: 'テスト' } });
    fireEvent.click(screen.getByText('登録する'));
    expect((screen.getByLabelText('保険の種類') as HTMLInputElement).value).toBe('');
  });
});
