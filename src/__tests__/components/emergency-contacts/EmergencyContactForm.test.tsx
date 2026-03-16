import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmergencyContactForm } from '@/components/emergency-contacts/EmergencyContactForm';
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

describe('EmergencyContactForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const members = [createMember(), createMember({ id: 'member-2', name: '花子' })];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('全フォーム要素を表示する', () => {
    render(<EmergencyContactForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('メンバー')).toBeInTheDocument();
    expect(screen.getByLabelText('連絡先名')).toBeInTheDocument();
    expect(screen.getByLabelText('電話番号')).toBeInTheDocument();
    expect(screen.getByLabelText(/続柄/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    expect(screen.getByText('登録する')).toBeInTheDocument();
  });

  it('メンバーが1人のみの場合は自動選択される', () => {
    const singleMember = [createMember()];
    render(<EmergencyContactForm members={singleMember} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('メンバー') as HTMLSelectElement;
    expect(select.value).toBe('member-1');
  });

  it('必須項目が空の場合は送信しない', () => {
    render(<EmergencyContactForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('フォームを正しく送信する', () => {
    render(<EmergencyContactForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('連絡先名'), { target: { value: '田中花子' } });
    fireEvent.change(screen.getByLabelText('電話番号'), { target: { value: '090-1234-5678' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith({
      memberId: 'member-1',
      contactName: '田中花子',
      phoneNumber: '090-1234-5678',
      relationship: undefined,
      notes: undefined,
    });
  });

  it('続柄プリセットを選択できる', () => {
    render(<EmergencyContactForm members={members} onSubmit={mockOnSubmit} />);
    const relationshipSelect = screen.getByLabelText(/続柄/) as HTMLSelectElement;
    fireEvent.change(relationshipSelect, { target: { value: '母' } });

    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('連絡先名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('電話番号'), { target: { value: '000' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ relationship: '母' })
    );
  });

  it('その他を選択すると自由入力欄が表示される', () => {
    render(<EmergencyContactForm members={members} onSubmit={mockOnSubmit} />);
    const relationshipSelect = screen.getByLabelText(/続柄/) as HTMLSelectElement;
    fireEvent.change(relationshipSelect, { target: { value: 'other' } });
    const customInput = screen.getByPlaceholderText('続柄を入力してください');
    expect(customInput).toBeInTheDocument();
  });

  it('キャンセルボタンを表示し、クリックでonCancelが呼ばれる', () => {
    render(<EmergencyContactForm members={members} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('onCancelが未指定の場合はキャンセルボタンを表示しない', () => {
    render(<EmergencyContactForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.queryByText('キャンセル')).not.toBeInTheDocument();
  });

  it('initialDataがある場合は更新ボタンを表示する', () => {
    render(
      <EmergencyContactForm
        members={members}
        onSubmit={mockOnSubmit}
        initialData={{
          memberId: 'member-1',
          contactName: '田中花子',
          phoneNumber: '090-1234-5678',
          relationship: '母',
        }}
      />
    );
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.getByDisplayValue('田中花子')).toBeInTheDocument();
    expect(screen.getByDisplayValue('090-1234-5678')).toBeInTheDocument();
  });

  it('送信後にフォームがリセットされる（新規登録時）', () => {
    render(<EmergencyContactForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('連絡先名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('電話番号'), { target: { value: '000' } });
    fireEvent.click(screen.getByText('登録する'));
    expect((screen.getByLabelText('連絡先名') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('電話番号') as HTMLInputElement).value).toBe('');
  });
});
