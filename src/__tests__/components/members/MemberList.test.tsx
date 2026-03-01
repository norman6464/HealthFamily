import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberList } from '@/components/members/MemberList';
import { Member } from '@/domain/entities/Member';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  userId: 'user-1',
  memberType: 'human',
  name: '太郎',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('MemberList', () => {
  it('読み込み中は読み込みメッセージを表示する', () => {
    render(<MemberList members={[]} isLoading={true} onDelete={vi.fn()} />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('メンバーがない場合は空メッセージを表示する', () => {
    render(<MemberList members={[]} isLoading={false} onDelete={vi.fn()} />);
    expect(screen.getByText('メンバーがまだ登録されていません')).toBeInTheDocument();
  });

  it('メンバー一覧を表示する', () => {
    const members = [
      createMember({ id: 'm1', name: '太郎' }),
      createMember({ id: 'm2', name: '花子' }),
    ];
    render(<MemberList members={members} isLoading={false} onDelete={vi.fn()} />);
    expect(screen.getByText('太郎')).toBeInTheDocument();
    expect(screen.getByText('花子')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const onDelete = vi.fn();
    const members = [createMember({ id: 'm1', name: '太郎' })];
    render(<MemberList members={members} isLoading={false} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('削除'));
    expect(onDelete).toHaveBeenCalledWith('m1');
  });

  it('編集ボタンをクリックするとonEditが呼ばれる', () => {
    const onEdit = vi.fn();
    const member = createMember({ id: 'm1', name: '太郎' });
    render(<MemberList members={[member]} isLoading={false} onDelete={vi.fn()} onEdit={onEdit} />);
    fireEvent.click(screen.getByLabelText('編集'));
    expect(onEdit).toHaveBeenCalledWith(member);
  });

  it('onEditが未指定の場合は編集ボタンが表示されない', () => {
    const members = [createMember()];
    render(<MemberList members={members} isLoading={false} onDelete={vi.fn()} />);
    expect(screen.queryByLabelText('編集')).not.toBeInTheDocument();
  });

  it('薬管理リンクが表示される', () => {
    const members = [createMember({ id: 'm1' })];
    render(<MemberList members={members} isLoading={false} onDelete={vi.fn()} />);
    const link = screen.getByLabelText('薬管理');
    expect(link).toHaveAttribute('href', '/members/m1/medications');
  });
});
