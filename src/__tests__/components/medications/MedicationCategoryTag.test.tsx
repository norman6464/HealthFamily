import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MedicationCategoryTag } from '@/components/medications/MedicationCategoryTag';

describe('MedicationCategoryTag', () => {
  it('カテゴリ名を表示する', () => {
    render(<MedicationCategoryTag category="処方薬" />);
    expect(screen.getByText('処方薬')).toBeInTheDocument();
  });

  it('処方薬のスタイルが適用される', () => {
    const { container } = render(<MedicationCategoryTag category="処方薬" />);
    expect(container.querySelector('[class*="blue"]')).toBeInTheDocument();
  });

  it('市販薬のスタイルが適用される', () => {
    const { container } = render(<MedicationCategoryTag category="市販薬" />);
    expect(container.querySelector('[class*="green"]')).toBeInTheDocument();
  });

  it('サプリメントのスタイルが適用される', () => {
    const { container } = render(<MedicationCategoryTag category="サプリメント" />);
    expect(container.querySelector('[class*="purple"]')).toBeInTheDocument();
  });

  it('未知のカテゴリにはデフォルトスタイルが適用される', () => {
    const { container } = render(<MedicationCategoryTag category="その他" />);
    expect(container.querySelector('[class*="gray"]')).toBeInTheDocument();
  });
});
