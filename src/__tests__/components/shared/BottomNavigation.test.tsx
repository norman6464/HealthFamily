import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNavigation } from '@/components/shared/BottomNavigation';

describe('BottomNavigation', () => {
  it('全てのナビゲーションアイテムを表示する', () => {
    render(<BottomNavigation activePath="/" />);
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('お薬')).toBeInTheDocument();
    expect(screen.getByText('通院')).toBeInTheDocument();
    expect(screen.getByText('メンバー')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('アクティブなパスのリンクにaria-current="page"が設定される', () => {
    render(<BottomNavigation activePath="/" />);
    const homeLink = screen.getByText('ホーム').closest('a');
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('非アクティブなパスのリンクにはaria-currentが設定されない', () => {
    render(<BottomNavigation activePath="/" />);
    const membersLink = screen.getByText('メンバー').closest('a');
    expect(membersLink).not.toHaveAttribute('aria-current');
  });

  it('各リンクが正しいhrefを持つ', () => {
    render(<BottomNavigation activePath="/" />);
    expect(screen.getByText('ホーム').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('お薬').closest('a')).toHaveAttribute('href', '/medications');
    expect(screen.getByText('通院').closest('a')).toHaveAttribute('href', '/appointments');
    expect(screen.getByText('メンバー').closest('a')).toHaveAttribute('href', '/members');
    expect(screen.getByText('設定').closest('a')).toHaveAttribute('href', '/settings');
  });

  it('お薬ページがアクティブの場合の表示', () => {
    render(<BottomNavigation activePath="/medications" />);
    const medicationsLink = screen.getByText('お薬').closest('a');
    const homeLink = screen.getByText('ホーム').closest('a');
    expect(medicationsLink).toHaveAttribute('aria-current', 'page');
    expect(homeLink).not.toHaveAttribute('aria-current');
  });

  it('navにaria-labelが設定されている', () => {
    render(<BottomNavigation activePath="/" />);
    expect(screen.getByRole('navigation', { name: 'メインナビゲーション' })).toBeInTheDocument();
  });
});
