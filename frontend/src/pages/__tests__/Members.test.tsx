import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Members from '../Members';

// memberApiをモック
vi.mock('../../data/api/memberApi', () => ({
  memberApi: {
    getMembers: vi.fn().mockResolvedValue([
      {
        id: 'member-1',
        userId: 'user-1',
        name: 'パパ',
        memberType: 'human',
        createdAt: new Date(),
      },
      {
        id: 'member-2',
        userId: 'user-1',
        name: 'ポチ',
        memberType: 'pet',
        petType: 'dog',
        createdAt: new Date(),
      },
    ]),
    createMember: vi.fn().mockResolvedValue({
      id: 'member-3',
      userId: 'user-1',
      name: '新メンバー',
      memberType: 'human',
      createdAt: new Date(),
    }),
    deleteMember: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Members Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ヘッダーが表示される', () => {
    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    expect(screen.getByText('メンバー管理')).toBeInTheDocument();
  });

  it('追加ボタンが表示される', () => {
    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    expect(screen.getByText('+ 追加')).toBeInTheDocument();
  });

  it('メンバー一覧が読み込まれる', async () => {
    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('パパ')).toBeInTheDocument();
      expect(screen.getByText('ポチ')).toBeInTheDocument();
    });
  });

  it('追加ボタンでフォームが表示される', () => {
    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ 追加'));

    expect(screen.getByText('新しいメンバーを追加')).toBeInTheDocument();
    expect(screen.getByText('閉じる')).toBeInTheDocument();
  });

  it('BottomNavigationが表示される', () => {
    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    expect(screen.getByText('ホーム')).toBeInTheDocument();
  });
});
