import { describe, it, expect, vi, beforeEach } from 'vitest';
import { medicationApi } from '@/data/api/medicationApi';
import { apiClient } from '@/data/api/apiClient';
import { BackendMedication } from '@/data/api/types';

vi.mock('@/data/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

const mockMedication: BackendMedication = {
  id: 'med-1',
  memberId: 'member-1',
  userId: 'user-1',
  name: '頭痛薬',
  category: 'regular',
  dosageAmount: '1錠',
  frequency: '1日3回',
  stockQuantity: 10,
  isActive: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('medicationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMedicationsByMemberでメンバーの薬一覧を取得する', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([mockMedication]);
    const result = await medicationApi.getMedicationsByMember('member-1');
    expect(apiClient.get).toHaveBeenCalledWith('/medications/member/member-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('頭痛薬');
  });

  it('getMedicationByIdで単一の薬を取得する', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockMedication);
    const result = await medicationApi.getMedicationById('med-1');
    expect(result?.name).toBe('頭痛薬');
  });

  it('getMedicationByIdでエラー時にnullを返す', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));
    const result = await medicationApi.getMedicationById('invalid');
    expect(result).toBeNull();
  });

  it('createMedicationで薬を作成する', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(mockMedication);
    const result = await medicationApi.createMedication({
      name: '頭痛薬',
      memberId: 'member-1',
      category: 'regular',
      dosage: '1錠',
      frequency: '1日3回',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/medications', expect.objectContaining({ name: '頭痛薬' }));
    expect(result.name).toBe('頭痛薬');
  });

  it('updateMedicationで薬を更新する', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ ...mockMedication, stockQuantity: 20 });
    const result = await medicationApi.updateMedication('med-1', { stockQuantity: 20 });
    expect(apiClient.put).toHaveBeenCalledWith('/medications/med-1', { stockQuantity: 20 });
    expect(result.stockQuantity).toBe(20);
  });

  it('deleteMedicationで薬を削除する', async () => {
    vi.mocked(apiClient.del).mockResolvedValue(undefined);
    await medicationApi.deleteMedication('med-1');
    expect(apiClient.del).toHaveBeenCalledWith('/medications/med-1');
  });

  it('searchMedicationsで薬を検索する', async () => {
    const results = [{ id: 'med-1', name: '頭痛薬', category: 'regular', memberId: 'member-1', memberName: '太郎' }];
    vi.mocked(apiClient.get).mockResolvedValue(results);
    const result = await medicationApi.searchMedications('頭痛');
    expect(apiClient.get).toHaveBeenCalledWith('/medications/search?q=%E9%A0%AD%E7%97%9B');
    expect(result).toEqual(results);
  });

  it('getStockAlertsで在庫アラートを取得する', async () => {
    const alerts = [{ medicationId: 'med-1', medicationName: '頭痛薬' }];
    vi.mocked(apiClient.get).mockResolvedValue(alerts);
    const result = await medicationApi.getStockAlerts();
    expect(apiClient.get).toHaveBeenCalledWith('/medications/alerts');
    expect(result).toEqual(alerts);
  });
});
