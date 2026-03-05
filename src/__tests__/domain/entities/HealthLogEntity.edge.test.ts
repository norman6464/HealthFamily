import { describe, it, expect } from 'vitest';
import { HealthLogEntity, HealthLog, ConditionLevel } from '@/domain/entities/HealthLog';

const makeLog = (overrides: Partial<HealthLog> & { conditionLevel: ConditionLevel; recordedAt: Date }): HealthLog => ({
  id: 'log-1',
  memberId: 'member-1',
  memberName: 'Test',
  userId: 'user-1',
  symptoms: [],
  ...overrides,
});

describe('HealthLogEntity エッジケース', () => {
  describe('getDailyAverages', () => {
    it('0日指定で空配列を返す', () => {
      const result = HealthLogEntity.getDailyAverages([], 0, new Date('2026-03-05'));
      expect(result).toEqual([]);
    });

    it('全日データなしの場合averageがnull', () => {
      const result = HealthLogEntity.getDailyAverages([], 3, new Date('2026-03-05'));
      expect(result).toHaveLength(3);
      expect(result.every((d) => d.average === null)).toBe(true);
    });

    it('同日に複数記録がある場合は平均を丸める', () => {
      const logs = [
        makeLog({ conditionLevel: 3, recordedAt: new Date('2026-03-05T08:00:00') }),
        makeLog({ conditionLevel: 4, recordedAt: new Date('2026-03-05T20:00:00') }),
      ];
      const result = HealthLogEntity.getDailyAverages(logs, 1, new Date('2026-03-05'));
      expect(result[0].average).toBe(4); // Math.round(3.5) = 4
    });

    it('1日指定で当日のみ返す', () => {
      const result = HealthLogEntity.getDailyAverages([], 1, new Date('2026-03-05'));
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-03-05');
    });

    it('年をまたぐ範囲を正しく処理する', () => {
      const result = HealthLogEntity.getDailyAverages([], 3, new Date('2026-01-01'));
      expect(result[0].date).toBe('2025-12-30');
      expect(result[2].date).toBe('2026-01-01');
    });
  });

  describe('getConditionTrendDirection', () => {
    it('全てnullの場合stableを返す', () => {
      const result = HealthLogEntity.getConditionTrendDirection([
        { average: null },
        { average: null },
        { average: null },
      ]);
      expect(result).toBe('stable');
    });

    it('1件のみの場合stableを返す', () => {
      const result = HealthLogEntity.getConditionTrendDirection([{ average: 5 }]);
      expect(result).toBe('stable');
    });

    it('全て同値の場合stableを返す', () => {
      const result = HealthLogEntity.getConditionTrendDirection([
        { average: 3 },
        { average: 3 },
        { average: 3 },
        { average: 3 },
      ]);
      expect(result).toBe('stable');
    });

    it('差が0.5以下の場合stableを返す', () => {
      const result = HealthLogEntity.getConditionTrendDirection([
        { average: 3 },
        { average: 3 },
        { average: 3 },
        { average: 3.5 },
      ]);
      expect(result).toBe('stable');
    });

    it('nullが混在しても有効な値で判定する', () => {
      const result = HealthLogEntity.getConditionTrendDirection([
        { average: 1 },
        { average: null },
        { average: null },
        { average: 5 },
      ]);
      expect(result).toBe('up');
    });
  });

  describe('getMostFrequentSymptoms', () => {
    it('同数の症状はソート順に返す', () => {
      const logs = [
        makeLog({ conditionLevel: 3, recordedAt: new Date(), symptoms: ['headache'] }),
        makeLog({ conditionLevel: 3, recordedAt: new Date(), symptoms: ['fever'] }),
      ];
      const result = HealthLogEntity.getMostFrequentSymptoms(logs, 3);
      expect(result).toHaveLength(2);
      expect(result[0].count).toBe(1);
      expect(result[1].count).toBe(1);
    });

    it('limitが0の場合空配列を返す', () => {
      const logs = [
        makeLog({ conditionLevel: 3, recordedAt: new Date(), symptoms: ['headache'] }),
      ];
      const result = HealthLogEntity.getMostFrequentSymptoms(logs, 0);
      expect(result).toHaveLength(0);
    });

    it('症状なしの記録のみの場合空配列を返す', () => {
      const logs = [
        makeLog({ conditionLevel: 3, recordedAt: new Date(), symptoms: [] }),
        makeLog({ conditionLevel: 4, recordedAt: new Date(), symptoms: [] }),
      ];
      const result = HealthLogEntity.getMostFrequentSymptoms(logs);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAverageCondition', () => {
    it('空配列で0を返す', () => {
      expect(HealthLogEntity.getAverageCondition([])).toBe(0);
    });

    it('1件のみでそのレベルを返す', () => {
      const logs = [makeLog({ conditionLevel: 4, recordedAt: new Date() })];
      expect(HealthLogEntity.getAverageCondition(logs)).toBe(4);
    });

    it('小数点1桁に丸める', () => {
      const logs = [
        makeLog({ conditionLevel: 1, recordedAt: new Date() }),
        makeLog({ conditionLevel: 2, recordedAt: new Date() }),
        makeLog({ conditionLevel: 3, recordedAt: new Date() }),
      ];
      expect(HealthLogEntity.getAverageCondition(logs)).toBe(2);
    });
  });
});
