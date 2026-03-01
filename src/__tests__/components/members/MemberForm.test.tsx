import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberForm } from '@/components/members/MemberForm';

describe('MemberForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('フォームフィールドを表示する', () => {
    render(<MemberForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('名前')).toBeInTheDocument();
    expect(screen.getByLabelText('タイプ')).toBeInTheDocument();
    expect(screen.getByLabelText('生年月日')).toBeInTheDocument();
    expect(screen.getByLabelText('メモ')).toBeInTheDocument();
  });

  it('名前が空の場合送信しない', () => {
    render(<MemberForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('名前を入力して送信する', () => {
    render(<MemberForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('名前'), { target: { value: '太郎' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: '太郎', memberType: 'human' }));
  });

  it('ペットタイプ選択時にペットの種類が表示される', () => {
    render(<MemberForm onSubmit={mockOnSubmit} />);
    expect(screen.queryByLabelText('ペットの種類')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('タイプ'), { target: { value: 'pet' } });
    expect(screen.getByLabelText('ペットの種類')).toBeInTheDocument();
  });

  it('ペットタイプで送信するとpetTypeが含まれる', () => {
    render(<MemberForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('名前'), { target: { value: 'ポチ' } });
    fireEvent.change(screen.getByLabelText('タイプ'), { target: { value: 'pet' } });
    fireEvent.change(screen.getByLabelText('ペットの種類'), { target: { value: 'cat' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ポチ',
      memberType: 'pet',
      petType: 'cat',
    }));
  });

  it('編集モードでは更新するボタンとタイプ非表示', () => {
    const initialData = {
      id: 'member-1',
      userId: 'user-1',
      name: '太郎',
      memberType: 'human' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(<MemberForm onSubmit={mockOnSubmit} initialData={initialData} />);
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.queryByLabelText('タイプ')).not.toBeInTheDocument();
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    const mockOnCancel = vi.fn();
    render(<MemberForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
