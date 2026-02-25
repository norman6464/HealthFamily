import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Members from '../Members';

const mockCreateMember = vi.fn().mockResolvedValue({
  id: 'member-3',
  userId: 'user-1',
  name: '新メンバー',
  memberType: 'human',
  createdAt: new Date(),
});
const mockDeleteMember = vi.fn().mockResolvedValue(undefined);

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
    getMemberById: vi.fn().mockResolvedValue({
      id: 'member-1',
      userId: 'user-1',
      name: 'パパ',
      memberType: 'human',
      createdAt: new Date(),
    }),
    createMember: (...args: unknown[]) => mockCreateMember(...args),
    updateMember: vi.fn().mockResolvedValue({}),
    deleteMember: (...args: unknown[]) => mockDeleteMember(...args),
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

  it('フォーム送信でメンバーが作成される', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    // フォームを開く
    await user.click(screen.getByText('+ 追加'));

    // 名前を入力して送信
    await user.type(screen.getByPlaceholderText('名前を入力'), '花子');
    await user.click(screen.getByText('追加する'));

    await waitFor(() => {
      expect(mockCreateMember).toHaveBeenCalled();
    });
  });

  it('フォーム送信後にフォームが閉じる', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    await user.click(screen.getByText('+ 追加'));
    expect(screen.getByText('新しいメンバーを追加')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('名前を入力'), '花子');
    await user.click(screen.getByText('追加する'));

    await waitFor(() => {
      expect(screen.queryByText('新しいメンバーを追加')).not.toBeInTheDocument();
    });
  });

  it('削除ボタンでメンバーが削除される', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Members />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('パパ')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('削除');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteMember).toHaveBeenCalledWith('member-1');
    });
  });
});
