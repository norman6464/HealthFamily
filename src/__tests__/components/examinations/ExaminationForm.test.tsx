import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExaminationForm } from '@/components/examinations/ExaminationForm';
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

describe('ExaminationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const members = [createMember(), createMember({ id: 'member-2', name: '花子' })];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('全フォーム要素を表示する', () => {
    render(<ExaminationForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('メンバー')).toBeInTheDocument();
    expect(screen.getByLabelText('検査の種類')).toBeInTheDocument();
    expect(screen.getByLabelText('検査日')).toBeInTheDocument();
    expect(screen.getByLabelText(/次回検査日/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    expect(screen.getByText('登録する')).toBeInTheDocument();
  });

  it('メンバーが1人のみの場合は自動選択される', () => {
    render(<ExaminationForm members={[createMember()]} onSubmit={mockOnSubmit} />);
    const select = screen.getByLabelText('メンバー') as HTMLSelectElement;
    expect(select.value).toBe('member-1');
  });

  it('必須項目が空の場合は送信しない', () => {
    render(<ExaminationForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('フォームを正しく送信する', () => {
    render(<ExaminationForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('検査の種類'), { target: { value: '血液検査' } });
    fireEvent.change(screen.getByLabelText('検査日'), { target: { value: '2025-11-15' } });
    fireEvent.click(screen.getByText('登録する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      memberId: 'member-1',
      examinationType: '血液検査',
    }));
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    render(<ExaminationForm members={members} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('onCancelが未指定の場合はキャンセルボタンを表示しない', () => {
    render(<ExaminationForm members={members} onSubmit={mockOnSubmit} />);
    expect(screen.queryByText('キャンセル')).not.toBeInTheDocument();
  });

  it('initialDataがある場合は更新ボタンを表示する', () => {
    render(
      <ExaminationForm
        members={members}
        onSubmit={mockOnSubmit}
        initialData={{
          memberId: 'member-1',
          examinationType: 'CT検査',
          examinedAt: new Date('2025-06-01'),
        }}
      />
    );
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CT検査')).toBeInTheDocument();
  });

  it('送信後にフォームがリセットされる（新規登録時）', async () => {
    render(<ExaminationForm members={members} onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('メンバー'), { target: { value: 'member-1' } });
    fireEvent.change(screen.getByLabelText('検査の種類'), { target: { value: 'テスト' } });
    fireEvent.click(screen.getByText('登録する'));
    await waitFor(() => {
      expect((screen.getByLabelText('検査の種類') as HTMLInputElement).value).toBe('');
    });
  });
});
