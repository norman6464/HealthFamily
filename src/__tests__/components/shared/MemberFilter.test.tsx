import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberFilter } from '@/components/shared/MemberFilter';

describe('MemberFilter', () => {
  const members = [
    { id: 'member-1', name: '太郎' },
    { id: 'member-2', name: '花子' },
  ];

  it('全員ボタンとメンバーボタンを表示する', () => {
    render(<MemberFilter members={members} selectedMemberId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('全員')).toBeInTheDocument();
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('花子')).toBeInTheDocument();
  });

  it('メンバーが空の場合は何も表示しない', () => {
    const { container } = render(<MemberFilter members={[]} selectedMemberId={null} onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('全員が選択されているときは全員ボタンがaria-selected=trueになる', () => {
    render(<MemberFilter members={members} selectedMemberId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('全員')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('太郎')).toHaveAttribute('aria-selected', 'false');
  });

  it('メンバーが選択されているときは該当ボタンがaria-selected=trueになる', () => {
    render(<MemberFilter members={members} selectedMemberId="member-1" onSelect={vi.fn()} />);
    expect(screen.getByText('全員')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('太郎')).toHaveAttribute('aria-selected', 'true');
  });

  it('全員ボタンをクリックするとnullが渡される', () => {
    const onSelect = vi.fn();
    render(<MemberFilter members={members} selectedMemberId="member-1" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('全員'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('メンバーボタンをクリックするとメンバーIDが渡される', () => {
    const onSelect = vi.fn();
    render(<MemberFilter members={members} selectedMemberId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('花子'));
    expect(onSelect).toHaveBeenCalledWith('member-2');
  });
});
