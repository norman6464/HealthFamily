import { describe, it, expect, vi } from 'vitest';
import { GetHealthLogs, CreateHealthLog, DeleteHealthLog } from '@/domain/usecases/ManageHealthLogs';
import { HealthLogRepository } from '@/domain/repositories/HealthLogRepository';
import { HealthLog, ConditionLevel } from '@/domain/entities/HealthLog';

const createMockLog = (overrides: Partial<HealthLog> = {}): HealthLog => ({
  id: 'log-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  userId: 'user-1',
  conditionLevel: 3 as ConditionLevel,
  symptoms: [],
  recordedAt: new Date('2026-03-05T10:00:00'),
  ...overrides,
});

const createMockRepository = (): HealthLogRepository => ({
  getLogs: vi.fn(),
  createLog: vi.fn(),
  deleteLog: vi.fn(),
});

describe('ManageHealthLogs', () => {
  describe('GetHealthLogs', () => {
    it('記録を日付ごとにグループ化して返す', async () => {
      const repo = createMockRepository();
      vi.mocked(repo.getLogs).mockResolvedValue([
        createMockLog({ id: '1', recordedAt: new Date('2026-03-05T10:00:00') }),
        createMockLog({ id: '2', recordedAt: new Date('2026-03-05T14:00:00') }),
        createMockLog({ id: '3', recordedAt: new Date('2026-03-04T09:00:00') }),
      ]);

      const useCase = new GetHealthLogs(repo);
      const result = await useCase.execute();

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-03-05');
      expect(result[0].logs).toHaveLength(2);
      expect(result[1].date).toBe('2026-03-04');
    });

    it('空の場合は空配列を返す', async () => {
      const repo = createMockRepository();
      vi.mocked(repo.getLogs).mockResolvedValue([]);

      const useCase = new GetHealthLogs(repo);
      const result = await useCase.execute();

      expect(result).toEqual([]);
    });
  });

  describe('CreateHealthLog', () => {
    it('正常な入力で記録を作成する', async () => {
      const repo = createMockRepository();
      const useCase = new CreateHealthLog(repo);

      await useCase.execute({ memberId: 'member-1', conditionLevel: 4 });

      expect(repo.createLog).toHaveBeenCalledWith({
        memberId: 'member-1',
        conditionLevel: 4,
      });
    });

    it('メンバーIDが空の場合エラーを投げる', async () => {
      const repo = createMockRepository();
      const useCase = new CreateHealthLog(repo);

      await expect(useCase.execute({ memberId: '', conditionLevel: 3 }))
        .rejects.toThrow('メンバーIDは必須です');
    });

    it('体調レベルが範囲外の場合エラーを投げる', async () => {
      const repo = createMockRepository();
      const useCase = new CreateHealthLog(repo);

      await expect(useCase.execute({ memberId: 'member-1', conditionLevel: 0 }))
        .rejects.toThrow('体調レベルは1-5の範囲で指定してください');

      await expect(useCase.execute({ memberId: 'member-1', conditionLevel: 6 }))
        .rejects.toThrow('体調レベルは1-5の範囲で指定してください');
    });
  });

  describe('DeleteHealthLog', () => {
    it('記録を削除する', async () => {
      const repo = createMockRepository();
      const useCase = new DeleteHealthLog(repo);

      await useCase.execute('log-1');

      expect(repo.deleteLog).toHaveBeenCalledWith('log-1');
    });

    it('記録IDが空の場合エラーを投げる', async () => {
      const repo = createMockRepository();
      const useCase = new DeleteHealthLog(repo);

      await expect(useCase.execute('')).rejects.toThrow('記録IDは必須です');
    });
  });
});
