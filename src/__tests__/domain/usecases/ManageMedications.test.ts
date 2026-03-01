import { describe, it, expect, vi } from 'vitest';
import { GetMedications, CreateMedication, UpdateMedication, DeleteMedication, SearchMedications, GetStockAlerts } from '@/domain/usecases/ManageMedications';
import { MedicationRepository } from '@/domain/repositories/MedicationRepository';
import { Medication } from '@/domain/entities/Medication';

const mockMedication: Medication = {
  id: 'med-1',
  memberId: 'mem-1',
  userId: 'user-1',
  name: 'テスト薬',
  category: 'regular',
  dosage: '1錠',
  frequency: '1日3回',
  stockQuantity: 30,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockRepository = (): MedicationRepository => ({
  getMedicationsByMember: vi.fn().mockResolvedValue([mockMedication]),
  getMedicationById: vi.fn().mockResolvedValue(mockMedication),
  createMedication: vi.fn().mockResolvedValue(mockMedication),
  updateMedication: vi.fn().mockResolvedValue({ ...mockMedication, name: '更新薬' }),
  deleteMedication: vi.fn().mockResolvedValue(undefined),
  searchMedications: vi.fn().mockResolvedValue([]),
  getStockAlerts: vi.fn().mockResolvedValue([]),
});

describe('GetMedications', () => {
  it('薬一覧をViewModelとして取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetMedications(repo);
    const result = await useCase.execute('mem-1');

    expect(result).toHaveLength(1);
    expect(result[0].medication.name).toBe('テスト薬');
    expect(result[0].displayInfo).toBeDefined();
    expect(result[0].displayInfo.name).toBe('テスト薬');
    expect(typeof result[0].isLowStock).toBe('boolean');
  });

  it('在庫少の薬をisLowStock=trueで返す', async () => {
    const repo = createMockRepository();
    // stockAlertDateが10日後で在庫が2日分 → 在庫少
    const lowStockMed: Medication = {
      ...mockMedication,
      stockQuantity: 2,
      stockAlertDate: new Date(Date.now() + 10 * 86400000),
    };
    (repo.getMedicationsByMember as ReturnType<typeof vi.fn>).mockResolvedValue([lowStockMed]);
    const useCase = new GetMedications(repo);
    const result = await useCase.execute('mem-1');

    expect(result[0].isLowStock).toBe(true);
  });

  it('空の配列を返す場合もエラーにならない', async () => {
    const repo = createMockRepository();
    (repo.getMedicationsByMember as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const useCase = new GetMedications(repo);
    const result = await useCase.execute('mem-1');

    expect(result).toHaveLength(0);
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getMedicationsByMember as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB接続エラー'));
    const useCase = new GetMedications(repo);

    await expect(useCase.execute('mem-1')).rejects.toThrow('DB接続エラー');
  });
});

describe('CreateMedication', () => {
  it('有効な入力で薬を作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMedication(repo);
    const result = await useCase.execute({
      memberId: 'mem-1',
      userId: 'user-1',
      name: 'テスト薬',
      category: 'regular',
    });

    expect(result.name).toBe('テスト薬');
    expect(repo.createMedication).toHaveBeenCalled();
  });

  it('空の名前の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMedication(repo);

    await expect(
      useCase.execute({
        memberId: 'mem-1',
        userId: 'user-1',
        name: '',
        category: 'regular',
      })
    ).rejects.toThrow('薬の名前は必須です');
  });

  it('空白のみの名前の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMedication(repo);

    await expect(
      useCase.execute({
        memberId: 'mem-1',
        userId: 'user-1',
        name: '   ',
        category: 'regular',
      })
    ).rejects.toThrow('薬の名前は必須です');
  });
});

describe('UpdateMedication', () => {
  it('存在する薬を更新する', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateMedication(repo);
    const result = await useCase.execute('med-1', { name: '更新薬' });

    expect(result.name).toBe('更新薬');
    expect(repo.getMedicationById).toHaveBeenCalledWith('med-1');
    expect(repo.updateMedication).toHaveBeenCalledWith('med-1', { name: '更新薬' });
  });

  it('存在しない薬の更新でエラーを投げる', async () => {
    const repo = createMockRepository();
    (repo.getMedicationById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const useCase = new UpdateMedication(repo);

    await expect(
      useCase.execute('nonexistent', { name: '更新' })
    ).rejects.toThrow('薬が見つかりません');
  });
});

describe('DeleteMedication', () => {
  it('存在する薬を削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteMedication(repo);
    await useCase.execute('med-1');

    expect(repo.getMedicationById).toHaveBeenCalledWith('med-1');
    expect(repo.deleteMedication).toHaveBeenCalledWith('med-1');
  });

  it('存在しない薬の削除でエラーを投げる', async () => {
    const repo = createMockRepository();
    (repo.getMedicationById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const useCase = new DeleteMedication(repo);

    await expect(
      useCase.execute('nonexistent')
    ).rejects.toThrow('薬が見つかりません');
  });
});

describe('SearchMedications', () => {
  it('検索クエリでリポジトリを呼び出す', async () => {
    const repo = createMockRepository();
    const results = [{ id: '1', name: 'アスピリン', category: 'regular', memberId: 'm1', memberName: '太郎' }];
    (repo.searchMedications as ReturnType<typeof vi.fn>).mockResolvedValue(results);

    const useCase = new SearchMedications(repo);
    const result = await useCase.execute('アスピリン');

    expect(result).toEqual(results);
    expect(repo.searchMedications).toHaveBeenCalledWith('アスピリン');
  });

  it('空のクエリでは空配列を返す', async () => {
    const repo = createMockRepository();
    const useCase = new SearchMedications(repo);
    const result = await useCase.execute('');

    expect(result).toEqual([]);
    expect(repo.searchMedications).not.toHaveBeenCalled();
  });

  it('空白のみのクエリでは空配列を返す', async () => {
    const repo = createMockRepository();
    const useCase = new SearchMedications(repo);
    const result = await useCase.execute('   ');

    expect(result).toEqual([]);
    expect(repo.searchMedications).not.toHaveBeenCalled();
  });
});

describe('GetStockAlerts', () => {
  it('在庫アラートを取得する', async () => {
    const repo = createMockRepository();
    const alerts = [{ medicationId: 'm1', medicationName: 'テスト薬', memberId: 'mem1', memberName: '太郎', stockQuantity: 5, stockAlertDate: '2026-03-05', daysUntilAlert: 5, isOverdue: false }];
    (repo.getStockAlerts as ReturnType<typeof vi.fn>).mockResolvedValue(alerts);

    const useCase = new GetStockAlerts(repo);
    const result = await useCase.execute();

    expect(result).toEqual(alerts);
    expect(repo.getStockAlerts).toHaveBeenCalled();
  });

  it('リポジトリエラーが伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getStockAlerts as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('接続エラー'));

    const useCase = new GetStockAlerts(repo);
    await expect(useCase.execute()).rejects.toThrow('接続エラー');
  });
});
