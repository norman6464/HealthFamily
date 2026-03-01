import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickStockCheckCard } from '@/components/dashboard/QuickStockCheckCard';

const mockItems = [
  { medicationId: '1', medicationName: '薬A', stockQuantity: 3, memberName: '太郎' },
  { medicationId: '2', medicationName: '薬B', stockQuantity: 0, memberName: '花子' },
  { medicationId: '3', medicationName: '薬C', stockQuantity: 5, memberName: '太郎' },
];

describe('QuickStockCheckCard', () => {
  it('在庫不足の薬を表示する', () => {
    render(<QuickStockCheckCard items={mockItems} />);
    expect(screen.getByText('薬A')).toBeInTheDocument();
    expect(screen.getByText('薬B')).toBeInTheDocument();
  });

  it('在庫数を表示する', () => {
    render(<QuickStockCheckCard items={mockItems} />);
    expect(screen.getByText(/残り3/)).toBeInTheDocument();
    expect(screen.getByText(/残り0/)).toBeInTheDocument();
  });

  it('メンバー名を表示する', () => {
    render(<QuickStockCheckCard items={mockItems} />);
    expect(screen.getAllByText(/太郎/).length).toBeGreaterThan(0);
    expect(screen.getByText(/花子/)).toBeInTheDocument();
  });

  it('空リストの場合は何も表示しない', () => {
    const { container } = render(<QuickStockCheckCard items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('補充ボタンをクリックするとonRefillが呼ばれる', () => {
    const onRefill = vi.fn();
    render(<QuickStockCheckCard items={mockItems} onRefill={onRefill} />);
    const buttons = screen.getAllByLabelText('補充');
    fireEvent.click(buttons[0]);
    expect(onRefill).toHaveBeenCalledWith('1');
  });
});
