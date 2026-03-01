import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFilter } from '@/components/shared/CategoryFilter';

describe('CategoryFilter', () => {
  it('すべてボタンとカテゴリボタンを表示する', () => {
    render(<CategoryFilter selectedCategory={null} onSelect={vi.fn()} />);
    expect(screen.getByText('すべて')).toBeInTheDocument();
    expect(screen.getByText('常用薬')).toBeInTheDocument();
    expect(screen.getByText('サプリメント')).toBeInTheDocument();
  });

  it('すべてが選択されているときはaria-selected=trueになる', () => {
    render(<CategoryFilter selectedCategory={null} onSelect={vi.fn()} />);
    expect(screen.getByText('すべて')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('常用薬')).toHaveAttribute('aria-selected', 'false');
  });

  it('カテゴリが選択されているときは該当ボタンがaria-selected=trueになる', () => {
    render(<CategoryFilter selectedCategory="supplement" onSelect={vi.fn()} />);
    expect(screen.getByText('すべて')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('サプリメント')).toHaveAttribute('aria-selected', 'true');
  });

  it('すべてボタンをクリックするとnullが渡される', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selectedCategory="regular" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('すべて'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('カテゴリボタンをクリックするとカテゴリIDが渡される', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selectedCategory={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('頓服薬'));
    expect(onSelect).toHaveBeenCalledWith('prn');
  });

  it('availableCategoriesで絞り込める', () => {
    render(<CategoryFilter selectedCategory={null} onSelect={vi.fn()} availableCategories={['regular', 'supplement']} />);
    expect(screen.getByText('常用薬')).toBeInTheDocument();
    expect(screen.getByText('サプリメント')).toBeInTheDocument();
    expect(screen.queryByText('頓服薬')).not.toBeInTheDocument();
  });
});
