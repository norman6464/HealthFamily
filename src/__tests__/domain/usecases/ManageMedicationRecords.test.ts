import { describe, it, expect, vi } from 'vitest';
import { GetMedicationHistory, CreateMedicationRecord, DeleteMedicationRecord, GetAdherenceStats } from '@/domain/usecases/ManageMedicationRecords';
import { MedicationRecordRepository } from '@/domain/repositories/MedicationRecordRepository';
import { MedicationRecord } from '@/domain/entities/MedicationRecord';

const mockRecords: MedicationRecord[] = [
  {
    id: 'rec-1',
    memberId: 'member-1',
    memberName: 'テスト太郎',
    medicationId: 'med-1',
    medicationName: 'テスト薬A',
    userId: 'user-1',
    takenAt: new Date('2025-06-15T08:00:00'),
  },
  {
    id: 'rec-2',
    memberId: 'member-1',
    memberName: 'テスト太郎',
    medicationId: 'med-2',
    medicationName: 'テスト薬B',
    userId: 'user-1',
    takenAt: new Date('2025-06-15T12:00:00'),
  },
  {
    id: 'rec-3',
    memberId: 'member-1',
    memberName: 'テスト太郎',
    medicationId: 'med-1',
    medicationName: 'テスト薬A',
    userId: 'user-1',
    takenAt: new Date('2025-06-14T08:00:00'),
  },
];

const mockStats = {
  overall: { weeklyRate: 85, monthlyRate: 72, weeklyCount: 12, monthlyCount: 45 },
  members: [],
};

const createMockRepository = (): MedicationRecordRepository => ({
  getHistory: vi.fn().mockResolvedValue(mockRecords),
  createRecord: vi.fn().mockResolvedValue(undefined),
  deleteRecord: vi.fn().mockResolvedValue(undefined),
  getAdherenceStats: vi.fn().mockResolvedValue(mockStats),
});

describe('GetMedicationHistory', () => {
  it('服薬履歴を日付グループで取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetMedicationHistory(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2025-06-15');
    expect(result[0].records).toHaveLength(2);
    expect(result[1].date).toBe('2025-06-14');
    expect(result[1].records).toHaveLength(1);
  });

  it('空の履歴を正しく処理する', async () => {
    const repo = createMockRepository();
    (repo.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const useCase = new GetMedicationHistory(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(0);
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getHistory as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB接続エラー'));
    const useCase = new GetMedicationHistory(repo);

    await expect(useCase.execute()).rejects.toThrow('DB接続エラー');
  });
});

describe('CreateMedicationRecord', () => {
  it('有効な入力で服薬記録を作成する', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMedicationRecord(repo);
    await useCase.execute({
      memberId: 'member-1',
      medicationId: 'med-1',
    });

    expect(repo.createRecord).toHaveBeenCalled();
  });

  it('メンバーIDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMedicationRecord(repo);

    await expect(
      useCase.execute({ memberId: '', medicationId: 'med-1' })
    ).rejects.toThrow('メンバーIDは必須です');
  });

  it('薬IDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new CreateMedicationRecord(repo);

    await expect(
      useCase.execute({ memberId: 'member-1', medicationId: '' })
    ).rejects.toThrow('薬IDは必須です');
  });
});

describe('DeleteMedicationRecord', () => {
  it('服薬記録を削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteMedicationRecord(repo);
    await useCase.execute('rec-1');

    expect(repo.deleteRecord).toHaveBeenCalledWith('rec-1');
  });

  it('記録IDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteMedicationRecord(repo);

    await expect(useCase.execute('')).rejects.toThrow('記録IDは必須です');
  });
});

describe('GetAdherenceStats', () => {
  it('アドヒアランス統計を取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetAdherenceStats(repo);
    const result = await useCase.execute();

    expect(result).toEqual(mockStats);
    expect(repo.getAdherenceStats).toHaveBeenCalled();
  });

  it('リポジトリエラーが伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getAdherenceStats as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('APIエラー'));
    const useCase = new GetAdherenceStats(repo);

    await expect(useCase.execute()).rejects.toThrow('APIエラー');
  });
});
