import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberList } from '../MemberList';
import { Member } from '../../../domain/entities/Member';

const mockMembers: Member[] = [
  {
    id: 'member-1',
    userId: 'user-1',
    memberType: 'human',
    name: 'パパ',
    birthDate: new Date('1985-06-15'),
    notes: '高血圧',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'member-2',
    userId: 'user-1',
    memberType: 'human',
    name: 'ママ',
    birthDate: new Date('1988-03-20'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'member-3',
    userId: 'user-1',
    memberType: 'pet',
    name: 'ポチ',
    petType: 'dog',
    birthDate: new Date('2020-03-10'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('MemberList', () => {
  it('メンバー一覧が正しく表示される', () => {
    render(<MemberList members={mockMembers} isLoading={false} onDelete={vi.fn()} />);

    expect(screen.getByText('パパ')).toBeInTheDocument();
    expect(screen.getByText('ママ')).toBeInTheDocument();
    expect(screen.getByText('ポチ')).toBeInTheDocument();
  });

  it('メンバータイプのラベルが表示される', () => {
    render(<MemberList members={mockMembers} isLoading={false} onDelete={vi.fn()} />);

    const familyLabels = screen.getAllByText('家族');
    expect(familyLabels).toHaveLength(2);

    expect(screen.getByText('ペット')).toBeInTheDocument();
  });

  it('メンバーのアイコンが表示される', () => {
    render(<MemberList members={mockMembers} isLoading={false} onDelete={vi.fn()} />);

    expect(screen.getAllByText('👤')).toHaveLength(2);
    expect(screen.getByText('🐕')).toBeInTheDocument();
  });

  it('空状態が正しく表示される', () => {
    render(<MemberList members={[]} isLoading={false} onDelete={vi.fn()} />);

    expect(screen.getByText('メンバーがまだ登録されていません')).toBeInTheDocument();
  });

  it('ローディング状態が正しく表示される', () => {
    render(<MemberList members={[]} isLoading={true} onDelete={vi.fn()} />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const onDelete = vi.fn();
    render(<MemberList members={mockMembers} isLoading={false} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: '削除' });
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith('member-1');
  });
});
