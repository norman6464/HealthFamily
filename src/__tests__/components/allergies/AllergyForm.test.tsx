import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllergyForm } from '@/components/allergies/AllergyForm';
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

describe('AllergyForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const members = [createMember(), createMember({ id: 'member-2', name: '花子' })];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('全フォーム要素を表示する', () => {
    render(<AllergyForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('メンバー')).toBeInTheDocument();
    expect(screen.getByLabelText('アレルゲン名')).toBeInTheDocument();
    expect(screen.getByLabelText('アレルギーの種類')).toBeInTheDocument();
    expect(screen.getByLabelText('重症度')).toBeInTheDocument();
    expect(screen.getByLabelText(/症状/)).toBeInTheDocument();
    expect(screen.getByLabelText(/診断日/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    expect(screen.getByText('登録する')).toBeInTheDocument();
  });

  it('メンバーが1人のみの場合は自動選択される', () => {
    render(<AllergyForm members={[createMember()]} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('メンバー') as HTMLSelectElement;
    expect(select.value).toBe('member-1');
  });

  it('必須項目が空の場合は送信しない', () => {
    render(<AllergyForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('フォームを正しく送信する', () => {
    render(<AllergyForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('アレルゲン名'), { target: { value: 'ピーナッツ' } });
    fireEvent.change(screen.getByLabelText('アレルギーの種類'), { target: { value: 'food' } });
    fireEvent.change(screen.getByLabelText('重症度'), { target: { value: 'severe' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      memberId: 'member-1',
      allergenName: 'ピーナッツ',
      allergyType: 'food',
      severity: 'severe',
    }));
  });

  it('アレルギー種類の選択肢を表示する', () => {
    render(<AllergyForm members={members} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('アレルギーの種類') as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll('option'));
    const labels = options.map(o => o.textContent);
    expect(labels).toContain('食物');
    expect(labels).toContain('薬物');
    expect(labels).toContain('環境');
    expect(labels).toContain('花粉');
    expect(labels).toContain('アトピー');
    expect(labels).toContain('その他');
  });

  it('重症度の選択肢を表示する', () => {
    render(<AllergyForm members={members} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('重症度') as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll('option'));
    const labels = options.map(o => o.textContent);
    expect(labels).toContain('軽度');
    expect(labels).toContain('中度');
    expect(labels).toContain('重度');
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    render(<AllergyForm members={members} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('initialDataがある場合は更新ボタンを表示する', () => {
    render(
      <AllergyForm
        members={members}
        onSubmit={mockOnSubmit}
        initialData={{
          memberId: 'member-1',
          allergenName: '卵',
          allergyType: 'food',
          severity: 'moderate',
        }}
      />
    );
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.getByDisplayValue('卵')).toBeInTheDocument();
  });

  it('送信後にフォームがリセットされる（新規登録時）', () => {
    render(<AllergyForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('アレルゲン名'), { target: { value: 'テスト' } });
    fireEvent.change(screen.getByLabelText('アレルギーの種類'), { target: { value: 'food' } });
    fireEvent.change(screen.getByLabelText('重症度'), { target: { value: 'mild' } });
    fireEvent.click(screen.getByText('登録する'));
    expect((screen.getByLabelText('アレルゲン名') as HTMLInputElement).value).toBe('');
  });
});
