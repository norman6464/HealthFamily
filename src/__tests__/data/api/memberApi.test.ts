import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memberApi } from '@/data/api/memberApi';
import { apiClient } from '@/data/api/apiClient';
import { BackendMember } from '@/data/api/types';

vi.mock('@/data/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

const mockMember: BackendMember = {
  id: 'member-1',
  userId: 'user-1',
  name: '太郎',
  memberType: 'human',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('memberApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMembersでメンバー一覧を取得する', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([mockMember]);
    const result = await memberApi.getMembers('user-1');
    expect(apiClient.get).toHaveBeenCalledWith('/members');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('太郎');
    expect(result[0].memberType).toBe('human');
  });

  it('getMemberByIdで単一メンバーを取得する', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockMember);
    const result = await memberApi.getMemberById('member-1');
    expect(apiClient.get).toHaveBeenCalledWith('/members/member-1');
    expect(result?.name).toBe('太郎');
  });

  it('getMemberByIdでエラー時にnullを返す', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));
    const result = await memberApi.getMemberById('invalid');
    expect(result).toBeNull();
  });

  it('createMemberでメンバーを作成する', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(mockMember);
    const result = await memberApi.createMember({
      name: '太郎',
      memberType: 'human',
      userId: 'user-1',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/members', expect.objectContaining({ name: '太郎' }));
    expect(result.name).toBe('太郎');
  });

  it('updateMemberでメンバーを更新する', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ ...mockMember, name: '花子' });
    const result = await memberApi.updateMember('member-1', { name: '花子' });
    expect(apiClient.put).toHaveBeenCalledWith('/members/member-1', expect.objectContaining({ name: '花子' }));
    expect(result.name).toBe('花子');
  });

  it('deleteMemberでメンバーを削除する', async () => {
    vi.mocked(apiClient.del).mockResolvedValue(undefined);
    await memberApi.deleteMember('member-1');
    expect(apiClient.del).toHaveBeenCalledWith('/members/member-1');
  });

  it('getMemberSummariesでサマリーを取得する', async () => {
    const summaries = [{ memberId: 'member-1', memberName: '太郎', medicationCount: 3 }];
    vi.mocked(apiClient.get).mockResolvedValue(summaries);
    const result = await memberApi.getMemberSummaries();
    expect(apiClient.get).toHaveBeenCalledWith('/members/summary');
    expect(result).toEqual(summaries);
  });
});
