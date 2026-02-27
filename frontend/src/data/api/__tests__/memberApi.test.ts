import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memberApi } from '../memberApi';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

describe('memberApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMembersでメンバー一覧を取得できる', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([
      { memberId: 'mem-1', userId: 'user-1', name: 'パパ', memberType: 'human', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ]);

    const result = await memberApi.getMembers('user-1');

    expect(apiClient.get).toHaveBeenCalledWith('/members');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('mem-1');
    expect(result[0].name).toBe('パパ');
  });

  it('getMemberByIdでメンバーを取得できる', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(
      { memberId: 'mem-1', userId: 'user-1', name: 'パパ', memberType: 'human', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    );

    const result = await memberApi.getMemberById('mem-1');

    expect(apiClient.get).toHaveBeenCalledWith('/members/mem-1');
    expect(result?.id).toBe('mem-1');
  });

  it('getMemberByIdでエラー時にnullを返す', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Not found'));

    const result = await memberApi.getMemberById('nonexistent');
    expect(result).toBeNull();
  });

  it('createMemberでメンバーを作成できる', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(
      { memberId: 'mem-new', userId: 'user-1', name: '新メンバー', memberType: 'human', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    );

    const result = await memberApi.createMember({
      userId: 'user-1',
      memberType: 'human',
      name: '新メンバー',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/members', {
      name: '新メンバー',
      memberType: 'human',
      petType: undefined,
      birthDate: undefined,
      notes: undefined,
    });
    expect(result.id).toBe('mem-new');
  });

  it('createMemberでbirthDateをISO文字列に変換する', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(
      { memberId: 'mem-new', userId: 'user-1', name: 'テスト', memberType: 'human', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    );

    const birthDate = new Date('1990-01-01');
    await memberApi.createMember({
      userId: 'user-1',
      memberType: 'human',
      name: 'テスト',
      birthDate,
    });

    expect(vi.mocked(apiClient.post).mock.calls[0][1]).toHaveProperty('birthDate', birthDate.toISOString());
  });

  it('updateMemberでメンバーを更新できる', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce(
      { memberId: 'mem-1', userId: 'user-1', name: '更新名', memberType: 'human', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
    );

    const result = await memberApi.updateMember('mem-1', { name: '更新名' });

    expect(apiClient.put).toHaveBeenCalledWith('/members/mem-1', {
      name: '更新名',
      petType: undefined,
      birthDate: undefined,
      notes: undefined,
    });
    expect(result.name).toBe('更新名');
  });

  it('deleteMemberでメンバーを削除できる', async () => {
    vi.mocked(apiClient.del).mockResolvedValueOnce(undefined);

    await memberApi.deleteMember('mem-1');

    expect(apiClient.del).toHaveBeenCalledWith('/members/mem-1');
  });
});
