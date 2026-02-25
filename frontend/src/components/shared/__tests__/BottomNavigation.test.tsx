import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNavigation } from '../BottomNavigation';

const renderWithRouter = (activePath: string) => {
  return render(
    <MemoryRouter initialEntries={[activePath]}>
      <BottomNavigation activePath={activePath} />
    </MemoryRouter>
  );
};

describe('BottomNavigation', () => {
  it('全てのナビゲーション項目が表示される', () => {
    renderWithRouter('/');

    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('メンバー')).toBeInTheDocument();
    expect(screen.getByText('お薬')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('ホームがアクティブの場合、正しくハイライトされる', () => {
    renderWithRouter('/');

    const homeLink = screen.getByText('ホーム').closest('a');
    expect(homeLink?.className).toContain('text-primary-600');
  });

  it('メンバーがアクティブの場合、正しくハイライトされる', () => {
    renderWithRouter('/members');

    const membersLink = screen.getByText('メンバー').closest('a');
    expect(membersLink?.className).toContain('text-primary-600');
  });

  it('設定がアクティブの場合、正しくハイライトされる', () => {
    renderWithRouter('/settings');

    const settingsLink = screen.getByText('設定').closest('a');
    expect(settingsLink?.className).toContain('text-primary-600');
  });
});
