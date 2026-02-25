import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../Settings';

describe('Settings Page', () => {
  it('ヘッダーが表示される', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument();
  });

  it('キャラクター選択セクションが表示される', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(screen.getByText('キャラクター選択')).toBeInTheDocument();
  });

  it('キャラクター選択肢が表示される', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(screen.getByText('いぬ')).toBeInTheDocument();
    expect(screen.getByText('ねこ')).toBeInTheDocument();
    expect(screen.getByText('うさぎ')).toBeInTheDocument();
    expect(screen.getByText('インコ')).toBeInTheDocument();
  });

  it('BottomNavigationが表示される', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getAllByText('設定').length).toBeGreaterThanOrEqual(2);
  });
});
