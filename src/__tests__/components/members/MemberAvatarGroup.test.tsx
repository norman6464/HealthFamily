import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemberAvatarGroup } from '@/components/members/MemberAvatarGroup';

describe('MemberAvatarGroup', () => {
  it('メンバー名のイニシャルを表示する', () => {
    const members = [
      { id: '1', name: '太郎', memberType: 'human' as const },
      { id: '2', name: '花子', memberType: 'human' as const },
    ];
    render(<MemberAvatarGroup members={members} />);
    expect(screen.getByText('太')).toBeInTheDocument();
    expect(screen.getByText('花')).toBeInTheDocument();
  });

  it('最大表示数を超えるとカウントを表示する', () => {
    const members = [
      { id: '1', name: 'A', memberType: 'human' as const },
      { id: '2', name: 'B', memberType: 'human' as const },
      { id: '3', name: 'C', memberType: 'human' as const },
      { id: '4', name: 'D', memberType: 'human' as const },
    ];
    render(<MemberAvatarGroup members={members} max={3} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('メンバーが空の場合は何も表示しない', () => {
    const { container } = render(<MemberAvatarGroup members={[]} />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it('ペットタイプのメンバーも表示する', () => {
    const members = [
      { id: '1', name: 'ポチ', memberType: 'pet' as const },
    ];
    render(<MemberAvatarGroup members={members} />);
    expect(screen.getByText('ポ')).toBeInTheDocument();
  });
});
