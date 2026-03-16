import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VaccinationForm } from '@/components/vaccinations/VaccinationForm';
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

describe('VaccinationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const members = [createMember(), createMember({ id: 'member-2', name: '花子' })];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('全フォーム要素を表示する', () => {
    render(<VaccinationForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('メンバー')).toBeInTheDocument();
    expect(screen.getByLabelText('ワクチンの種類')).toBeInTheDocument();
    expect(screen.getByLabelText('ワクチン接種日')).toBeInTheDocument();
    expect(screen.getByLabelText(/次回ワクチン予定日/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    expect(screen.getByText('登録する')).toBeInTheDocument();
  });

  it('メンバーが1人のみの場合は自動選択される', () => {
    render(<VaccinationForm members={[createMember()]} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('メンバー') as HTMLSelectElement;
    expect(select.value).toBe('member-1');
  });

  it('必須項目が空の場合は送信しない', () => {
    render(<VaccinationForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('フォームを正しく送信する', () => {
    render(<VaccinationForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('ワクチンの種類'), { target: { value: 'インフルエンザ' } });
    fireEvent.change(screen.getByLabelText('ワクチン接種日'), { target: { value: '2025-10-01' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      memberId: 'member-1',
      vaccineName: 'インフルエンザ',
    }));
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    render(<VaccinationForm members={members} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('onCancelが未指定の場合はキャンセルボタンを表示しない', () => {
    render(<VaccinationForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.queryByText('キャンセル')).not.toBeInTheDocument();
  });

  it('initialDataがある場合は更新ボタンを表示する', () => {
    render(
      <VaccinationForm
        members={members}
        onSubmit={mockOnSubmit}
        initialData={{
          memberId: 'member-1',
          vaccineName: 'コロナワクチン',
          vaccinatedAt: new Date('2025-06-01'),
          notes: 'テストメモ',
        }}
      />
    );
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.getByDisplayValue('コロナワクチン')).toBeInTheDocument();
  });

  it('送信後にフォームがリセットされる（新規登録時）', () => {
    render(<VaccinationForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('ワクチンの種類'), { target: { value: 'テスト' } });
    fireEvent.click(screen.getByText('登録する'));
    expect((screen.getByLabelText('ワクチンの種類') as HTMLInputElement).value).toBe('');
  });
});
