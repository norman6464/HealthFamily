import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TakeWithNotesButton } from '@/components/medications/TakeWithNotesButton';

describe('TakeWithNotesButton', () => {
  const mockOnTake = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockOnTake.mockClear();
  });

  it('飲んだボタンを表示する', () => {
    render(<TakeWithNotesButton medicationId="med-1" memberId="member-1" onTake={mockOnTake} />);
    expect(screen.getByText('飲んだ')).toBeInTheDocument();
  });

  it('長押しでメモ入力欄を表示する', () => {
    render(<TakeWithNotesButton medicationId="med-1" memberId="member-1" onTake={mockOnTake} />);
    fireEvent.click(screen.getByLabelText('メモ付きで記録'));
    expect(screen.getByPlaceholderText('メモ（任意）')).toBeInTheDocument();
  });

  it('メモなしで飲んだを記録する', async () => {
    render(<TakeWithNotesButton medicationId="med-1" memberId="member-1" onTake={mockOnTake} />);
    fireEvent.click(screen.getByText('飲んだ'));
    await waitFor(() => {
      expect(mockOnTake).toHaveBeenCalledWith('member-1', 'med-1', undefined);
    });
  });

  it('メモ付きで飲んだを記録する', async () => {
    render(<TakeWithNotesButton medicationId="med-1" memberId="member-1" onTake={mockOnTake} />);
    fireEvent.click(screen.getByLabelText('メモ付きで記録'));
    fireEvent.change(screen.getByPlaceholderText('メモ（任意）'), { target: { value: '食後に服用' } });
    fireEvent.click(screen.getByText('記録'));
    await waitFor(() => {
      expect(mockOnTake).toHaveBeenCalledWith('member-1', 'med-1', '食後に服用');
    });
  });

  it('記録後に記録済みを表示する', async () => {
    render(<TakeWithNotesButton medicationId="med-1" memberId="member-1" onTake={mockOnTake} />);
    fireEvent.click(screen.getByText('飲んだ'));
    await waitFor(() => {
      expect(screen.getByText('記録済み')).toBeInTheDocument();
    });
  });
});
