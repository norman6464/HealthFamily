import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HospitalForm } from '@/components/hospitals/HospitalForm';

describe('HospitalForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('フォームフィールドを表示する', () => {
    render(<HospitalForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText('病院名')).toBeInTheDocument();
    expect(screen.getByLabelText('住所（任意）')).toBeInTheDocument();
    expect(screen.getByLabelText('電話番号（任意）')).toBeInTheDocument();
    expect(screen.getByLabelText('メモ（任意）')).toBeInTheDocument();
  });

  it('病院名が空の場合送信しない', () => {
    render(<HospitalForm onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('病院名のみで送信する', () => {
    render(<HospitalForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('病院名'), { target: { value: '東京病院' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: '東京病院',
      address: undefined,
      phone: undefined,
      notes: undefined,
    });
  });

  it('全フィールドを入力して送信する', () => {
    render(<HospitalForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('病院名'), { target: { value: '渋谷クリニック' } });
    fireEvent.change(screen.getByLabelText('住所（任意）'), { target: { value: '東京都渋谷区1-1' } });
    fireEvent.change(screen.getByLabelText('電話番号（任意）'), { target: { value: '03-1234-5678' } });
    fireEvent.change(screen.getByLabelText('メモ（任意）'), { target: { value: '予約制' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: '渋谷クリニック',
      address: '東京都渋谷区1-1',
      phone: '03-1234-5678',
      notes: '予約制',
    });
  });

  it('送信後にフォームがリセットされる', () => {
    render(<HospitalForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('病院名'), { target: { value: '病院名' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(screen.getByLabelText('病院名')).toHaveValue('');
  });

  it('空白のみの任意フィールドはundefinedで送信する', () => {
    render(<HospitalForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText('病院名'), { target: { value: 'テスト病院' } });
    fireEvent.change(screen.getByLabelText('住所（任意）'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('追加する'));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'テスト病院',
      address: undefined,
    }));
  });
});
