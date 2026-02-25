import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMedications, CreateMedication, DeleteMedication } from '../ManageMedications';
import { MedicationRepository } from '../../repositories/MedicationRepository';
import { Medication } from '../../entities/Medication';

const mockMedications: Medication[] = [
  {
    id: 'med-1',
    memberId: 'member-1',
    userId: 'user-1',
    name: '血圧の薬',
    category: 'regular',
    dosage: '1錠',
    frequency: '1日1回',
    stockQuantity: 10,
    lowStockThreshold: 5,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'med-2',
    memberId: 'member-1',
    userId: 'user-1',
    name: 'フィラリア薬',
    category: 'heartworm',
    stockQuantity: 3,
    lowStockThreshold: 5,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('GetMedications', () => {
  let mockRepository: MedicationRepository;

  beforeEach(() => {
    mockRepository = {
      getMedicationsByMember: vi.fn().mockResolvedValue(mockMedications),
      getMedicationById: vi.fn(),
      createMedication: vi.fn(),
      updateMedication: vi.fn(),
      deleteMedication: vi.fn(),
    };
  });

  it('メンバーの薬一覧を取得できる', async () => {
    const useCase = new GetMedications(mockRepository);
    const result = await useCase.execute('member-1');

    expect(mockRepository.getMedicationsByMember).toHaveBeenCalledWith('member-1');
    expect(result).toHaveLength(2);
  });

  it('在庫が少ない薬にフラグが付く', async () => {
    const useCase = new GetMedications(mockRepository);
    const result = await useCase.execute('member-1');

    expect(result[0].isLowStock).toBe(false);
    expect(result[1].isLowStock).toBe(true);
  });
});

describe('CreateMedication', () => {
  let mockRepository: MedicationRepository;

  beforeEach(() => {
    mockRepository = {
      getMedicationsByMember: vi.fn(),
      getMedicationById: vi.fn(),
      createMedication: vi.fn().mockResolvedValue({
        id: 'med-3',
        memberId: 'member-1',
        userId: 'user-1',
        name: '胃薬',
        category: 'regular',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateMedication: vi.fn(),
      deleteMedication: vi.fn(),
    };
  });

  it('新しい薬を作成できる', async () => {
    const useCase = new CreateMedication(mockRepository);
    const result = await useCase.execute({
      memberId: 'member-1',
      userId: 'user-1',
      name: '胃薬',
      category: 'regular',
    });

    expect(result.name).toBe('胃薬');
  });

  it('名前が空の場合、エラーをスローする', async () => {
    const useCase = new CreateMedication(mockRepository);

    await expect(
      useCase.execute({
        memberId: 'member-1',
        userId: 'user-1',
        name: '',
        category: 'regular',
      })
    ).rejects.toThrow('薬の名前は必須です');
  });
});

describe('DeleteMedication', () => {
  let mockRepository: MedicationRepository;

  beforeEach(() => {
    mockRepository = {
      getMedicationsByMember: vi.fn(),
      getMedicationById: vi.fn().mockResolvedValue(mockMedications[0]),
      createMedication: vi.fn(),
      updateMedication: vi.fn(),
      deleteMedication: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('薬を削除できる', async () => {
    const useCase = new DeleteMedication(mockRepository);
    await useCase.execute('med-1');

    expect(mockRepository.deleteMedication).toHaveBeenCalledWith('med-1');
  });

  it('存在しない薬を削除しようとするとエラーをスローする', async () => {
    mockRepository.getMedicationById = vi.fn().mockResolvedValue(null);
    const useCase = new DeleteMedication(mockRepository);

    await expect(useCase.execute('non-existent')).rejects.toThrow('薬が見つかりません');
  });
});
