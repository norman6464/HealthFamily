import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordApi } from '../recordApi';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('recordApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createRecordで服薬記録を作成できる', async () => {
    const record = { recordId: 'rec-1', memberId: 'mem-1', medicationId: 'med-1', userId: 'user-1', takenAt: '2024-01-01T08:00:00Z' };
    vi.mocked(apiClient.post).mockResolvedValueOnce(record);

    const result = await recordApi.createRecord({
      memberId: 'mem-1',
      medicationId: 'med-1',
      scheduleId: 'sch-1',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/records', {
      memberId: 'mem-1',
      medicationId: 'med-1',
      scheduleId: 'sch-1',
    });
    expect(result.recordId).toBe('rec-1');
  });

  it('getRecordsで記録一覧を取得できる', async () => {
    const records = [{ recordId: 'rec-1', memberId: 'mem-1', medicationId: 'med-1', userId: 'user-1', takenAt: '2024-01-01T08:00:00Z' }];
    vi.mocked(apiClient.get).mockResolvedValueOnce(records);

    const result = await recordApi.getRecords();

    expect(apiClient.get).toHaveBeenCalledWith('/records');
    expect(result).toHaveLength(1);
  });

  it('getRecordsByMemberでメンバー別記録を取得できる', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([]);

    const result = await recordApi.getRecordsByMember('mem-1');

    expect(apiClient.get).toHaveBeenCalledWith('/records/member/mem-1');
    expect(result).toEqual([]);
  });
});
