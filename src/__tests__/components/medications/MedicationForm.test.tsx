import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationForm } from '@/components/medications/MedicationForm';

describe('MedicationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('フォームフィールドを表示する', () => {
    render(<MedicationForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('薬の名前')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByLabelText('用量')).toBeInTheDocument();
    expect(screen.getByLabelText('頻度')).toBeInTheDocument();
  });

  it('名前が空の場合送信しない', () => {
    render(<MedicationForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('名前を入力して送信する', () => {
    render(<MedicationForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('薬の名前'), { target: { value: 'ロキソニン' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ロキソニン',
      category: 'regular',
    }));
  });

  it('カテゴリを変更して送信する', () => {
    render(<MedicationForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('薬の名前'), { target: { value: 'ビタミンC' } });
    fireEvent.change(screen.getByLabelText('カテゴリ'), { target: { value: 'supplement' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'ビタミンC',
      category: 'supplement',
    }));
  });

  it('編集モードでは更新するボタンを表示', () => {
    const initialData = {
      id: 'med-1',
      memberId: 'member-1',
      userId: 'user-1',
      name: 'テスト薬',
      category: 'regular' as const,
      dosage: '1錠',
      frequency: '1日1回',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(<MedicationForm onSubmit={mockOnSubmit} initialData={initialData} />);
    expect(screen.getByText('更新する')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テスト薬')).toBeInTheDocument();
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    render(<MedicationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText('キャンセル'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('在庫数を含めて送信する', () => {
    render(<MedicationForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('薬の名前'), { target: { value: '薬A' } });
    fireEvent.change(screen.getByLabelText('在庫数(何日分)'), { target: { value: '30' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: '薬A',
      stockQuantity: 30,
    }));
  });
});
