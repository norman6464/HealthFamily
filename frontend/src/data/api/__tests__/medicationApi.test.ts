import { describe, it, expect, vi, beforeEach } from 'vitest';
import { medicationApi } from '../medicationApi';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

const backendMed = {
  medicationId: 'med-1',
  memberId: 'mem-1',
  userId: 'user-1',
  name: '血圧の薬',
  category: 'regular',
  dosageAmount: '1錠',
  frequency: '1日1回',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('medicationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMedicationsByMemberで薬一覧を取得できる', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([backendMed]);

    const result = await medicationApi.getMedicationsByMember('mem-1');

    expect(apiClient.get).toHaveBeenCalledWith('/medications/member/mem-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('med-1');
    expect(result[0].dosage).toBe('1錠');
  });

  it('getMedicationByIdで薬を取得できる', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(backendMed);

    const result = await medicationApi.getMedicationById('med-1');

    expect(apiClient.get).toHaveBeenCalledWith('/medications/med-1');
    expect(result?.id).toBe('med-1');
  });

  it('getMedicationByIdでエラー時にnullを返す', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Not found'));

    const result = await medicationApi.getMedicationById('nonexistent');
    expect(result).toBeNull();
  });

  it('createMedicationで薬を作成できる', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      ...backendMed,
      medicationId: 'med-new',
      name: '新しい薬',
    });

    const result = await medicationApi.createMedication({
      memberId: 'mem-1',
      userId: 'user-1',
      name: '新しい薬',
      category: 'regular',
      dosage: '2錠',
      frequency: '1日2回',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/medications', {
      name: '新しい薬',
      memberId: 'mem-1',
      category: 'regular',
      dosageAmount: '2錠',
      frequency: '1日2回',
      stockQuantity: undefined,
      lowStockThreshold: undefined,
      instructions: undefined,
    });
    expect(result.id).toBe('med-new');
  });

  it('updateMedicationで薬を更新できる', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      ...backendMed,
      stockQuantity: 20,
    });

    const result = await medicationApi.updateMedication('med-1', {
      stockQuantity: 20,
      name: '更新薬',
      dosage: '3錠',
      frequency: '1日3回',
      lowStockThreshold: 5,
      instructions: '食前',
      isActive: false,
    });

    expect(apiClient.put).toHaveBeenCalledWith('/medications/med-1', {
      stockQuantity: 20,
      name: '更新薬',
      dosageAmount: '3錠',
      frequency: '1日3回',
      lowStockThreshold: 5,
      instructions: '食前',
      isActive: false,
    });
    expect(result.id).toBe('med-1');
  });

  it('deleteMedicationで薬を削除できる', async () => {
    vi.mocked(apiClient.del).mockResolvedValueOnce(undefined);

    await medicationApi.deleteMedication('med-1');

    expect(apiClient.del).toHaveBeenCalledWith('/medications/med-1');
  });
});
