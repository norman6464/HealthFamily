import { describe, it, expect } from 'vitest';
import { HealthLogEntity, HealthLog, ConditionLevel } from '@/domain/entities/HealthLog';

const createLog = (conditionLevel: ConditionLevel, recordedAt: string): HealthLog => ({
  id: `log-${recordedAt}`,
  memberId: 'member-1',
  memberName: '太郎',
  userId: 'user-1',
  conditionLevel,
  symptoms: [],
  recordedAt: new Date(recordedAt),
});

describe('HealthLogEntity 体調変化検知', () => {
  describe('detectConditionChange', () => {
    it('空配列は空配列を返す', () => {
      expect(HealthLogEntity.detectConditionChange([])).toEqual([]);
    });

    it('1件のみは空配列を返す', () => {
      const logs = [createLog(3, '2026-03-05')];
      expect(HealthLogEntity.detectConditionChange(logs)).toEqual([]);
    });

    it('体調レベルが2以上変化した箇所を検知する', () => {
      const logs = [
        createLog(4, '2026-03-05'),
        createLog(2, '2026-03-04'),
        createLog(3, '2026-03-03'),
      ];
      const result = HealthLogEntity.detectConditionChange(logs);
      expect(result).toHaveLength(1);
      expect(result[0].from).toBe(2);
      expect(result[0].to).toBe(4);
    });

    it('変化が小さい場合は空配列を返す', () => {
      const logs = [
        createLog(3, '2026-03-05'),
        createLog(4, '2026-03-04'),
        createLog(3, '2026-03-03'),
      ];
      expect(HealthLogEntity.detectConditionChange(logs)).toEqual([]);
    });

    it('カスタム閾値で検知する', () => {
      const logs = [
        createLog(3, '2026-03-05'),
        createLog(2, '2026-03-04'),
      ];
      const result = HealthLogEntity.detectConditionChange(logs, 1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getConditionTrend', () => {
    it('空配列は"stable"を返す', () => {
      expect(HealthLogEntity.getConditionTrend([])).toBe('stable');
    });

    it('1件のみは"stable"を返す', () => {
      expect(HealthLogEntity.getConditionTrend([createLog(3, '2026-03-05')])).toBe('stable');
    });

    it('改善傾向は"improving"を返す', () => {
      const logs = [
        createLog(4, '2026-03-05'),
        createLog(3, '2026-03-04'),
        createLog(2, '2026-03-03'),
      ];
      expect(HealthLogEntity.getConditionTrend(logs)).toBe('improving');
    });

    it('悪化傾向は"declining"を返す', () => {
      const logs = [
        createLog(2, '2026-03-05'),
        createLog(3, '2026-03-04'),
        createLog(4, '2026-03-03'),
      ];
      expect(HealthLogEntity.getConditionTrend(logs)).toBe('declining');
    });

    it('横ばいは"stable"を返す', () => {
      const logs = [
        createLog(3, '2026-03-05'),
        createLog(3, '2026-03-04'),
        createLog(3, '2026-03-03'),
      ];
      expect(HealthLogEntity.getConditionTrend(logs)).toBe('stable');
    });
  });

  describe('getWorstDay', () => {
    it('空配列はnullを返す', () => {
      expect(HealthLogEntity.getWorstDay([])).toBeNull();
    });

    it('最も体調レベルが低い記録を返す', () => {
      const logs = [
        createLog(3, '2026-03-05'),
        createLog(1, '2026-03-04'),
        createLog(4, '2026-03-03'),
      ];
      const result = HealthLogEntity.getWorstDay(logs);
      expect(result).not.toBeNull();
      expect(result!.conditionLevel).toBe(1);
    });

    it('同じレベルが複数ある場合は最初に見つかったものを返す', () => {
      const logs = [
        createLog(2, '2026-03-05'),
        createLog(2, '2026-03-04'),
        createLog(3, '2026-03-03'),
      ];
      const result = HealthLogEntity.getWorstDay(logs);
      expect(result!.id).toBe('log-2026-03-05');
    });
  });
});
