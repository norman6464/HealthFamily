import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StockRefillButton } from '@/components/medications/StockRefillButton';

describe('StockRefillButton', () => {
  it('補充ボタンを表示する', () => {
    render(<StockRefillButton medicationId="med-1" currentStock={5} onRefill={vi.fn()} />);
    expect(screen.getByLabelText('在庫補充')).toBeInTheDocument();
  });

  it('クリックで入力フォームを表示する', () => {
    render(<StockRefillButton medicationId="med-1" currentStock={5} onRefill={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('在庫補充'));
    expect(screen.getByLabelText('補充数')).toBeInTheDocument();
  });

  it('補充を実行する', async () => {
    const mockOnRefill = vi.fn().mockResolvedValue(undefined);
    render(<StockRefillButton medicationId="med-1" currentStock={5} onRefill={mockOnRefill} />);
    fireEvent.click(screen.getByLabelText('在庫補充'));
    fireEvent.change(screen.getByLabelText('補充数'), { target: { value: '30' } });
    fireEvent.click(screen.getByText('補充'));
    await waitFor(() => {
      expect(mockOnRefill).toHaveBeenCalledWith('med-1', 35);
    });
  });

  it('キャンセルでフォームを閉じる', () => {
    render(<StockRefillButton medicationId="med-1" currentStock={5} onRefill={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('在庫補充'));
    expect(screen.getByLabelText('補充数')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('キャンセル'));
    expect(screen.queryByLabelText('補充数')).not.toBeInTheDocument();
  });
});
