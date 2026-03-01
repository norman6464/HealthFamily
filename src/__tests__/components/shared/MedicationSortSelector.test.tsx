import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicationSortSelector } from '@/components/shared/MedicationSortSelector';

describe('MedicationSortSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('ソートオプションを表示する', () => {
    render(<MedicationSortSelector value="name" onChange={mockOnChange} />);
    expect(screen.getByText('名前順')).toBeInTheDocument();
  });

  it('ソートを変更するとonChangeが呼ばれる', () => {
    render(<MedicationSortSelector value="name" onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('在庫順'));
    expect(mockOnChange).toHaveBeenCalledWith('stock');
  });

  it('選択中のオプションがハイライトされる', () => {
    render(<MedicationSortSelector value="category" onChange={mockOnChange} />);
    const selected = screen.getByText('カテゴリ順');
    expect(selected.className).toContain('primary');
  });

  it('全てのソートオプションが存在する', () => {
    render(<MedicationSortSelector value="name" onChange={mockOnChange} />);
    expect(screen.getByText('名前順')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ順')).toBeInTheDocument();
    expect(screen.getByText('在庫順')).toBeInTheDocument();
  });
});
