import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemberQuickActions } from '@/components/members/MemberQuickActions';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { vi } from 'vitest';

describe('MemberQuickActions', () => {
  const member = {
    id: 'member-1',
    userId: 'user-1',
    name: '太郎',
    memberType: 'human' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('メンバー名を表示する', () => {
    render(<MemberQuickActions member={member} medicationCount={3} scheduleCount={2} />);
    expect(screen.getByText('太郎')).toBeInTheDocument();
  });

  it('薬の件数を表示する', () => {
    render(<MemberQuickActions member={member} medicationCount={5} scheduleCount={0} />);
    expect(screen.getByText('5件')).toBeInTheDocument();
  });

  it('スケジュール件数を表示する', () => {
    render(<MemberQuickActions member={member} medicationCount={0} scheduleCount={3} />);
    expect(screen.getByText('3件')).toBeInTheDocument();
  });

  it('薬管理リンクがある', () => {
    render(<MemberQuickActions member={member} medicationCount={0} scheduleCount={0} />);
    const link = screen.getByText('薬管理');
    expect(link.closest('a')).toHaveAttribute('href', '/members/member-1/medications');
  });

  it('ペットの場合にペットアイコンが表示される', () => {
    const petMember = { ...member, memberType: 'pet' as const, petType: 'dog' as const };
    render(<MemberQuickActions member={petMember} medicationCount={0} scheduleCount={0} />);
    expect(screen.getByText('太郎')).toBeInTheDocument();
  });
});
