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

describe('HealthLogEntity 体調変化検知 エッジケース', () => {
  describe('detectConditionChange 追加テスト', () => {
    it('全て同じ体調レベルは空配列を返す', () => {
      const logs = [
        createLog(3, '2026-03-05'),
        createLog(3, '2026-03-04'),
        createLog(3, '2026-03-03'),
        createLog(3, '2026-03-02'),
      ];
      expect(HealthLogEntity.detectConditionChange(logs)).toEqual([]);
    });

    it('1→5の急激な変化を検知する', () => {
      const logs = [
        createLog(5, '2026-03-05'),
        createLog(1, '2026-03-04'),
      ];
      const result = HealthLogEntity.detectConditionChange(logs);
      expect(result).toHaveLength(1);
      expect(result[0].from).toBe(1);
      expect(result[0].to).toBe(5);
    });

    it('5→1の急激な悪化を検知する', () => {
      const logs = [
        createLog(1, '2026-03-05'),
        createLog(5, '2026-03-04'),
      ];
      const result = HealthLogEntity.detectConditionChange(logs);
      expect(result).toHaveLength(1);
      expect(result[0].from).toBe(5);
      expect(result[0].to).toBe(1);
    });

    it('複数箇所で変化を検知する', () => {
      const logs = [
        createLog(5, '2026-03-05'),
        createLog(1, '2026-03-04'),
        createLog(4, '2026-03-03'),
        createLog(2, '2026-03-02'),
      ];
      const result = HealthLogEntity.detectConditionChange(logs);
      expect(result).toHaveLength(3);
    });

    it('閾値3で検知する', () => {
      const logs = [
        createLog(5, '2026-03-05'),
        createLog(2, '2026-03-04'),
      ];
      const result = HealthLogEntity.detectConditionChange(logs, 3);
      expect(result).toHaveLength(1);
    });

    it('閾値3で差が2の場合は検知しない', () => {
      const logs = [
        createLog(4, '2026-03-05'),
        createLog(2, '2026-03-04'),
      ];
      expect(HealthLogEntity.detectConditionChange(logs, 3)).toEqual([]);
    });
  });

  describe('getConditionTrend 追加テスト', () => {
    it('2件で改善', () => {
      const logs = [createLog(4, '2026-03-05'), createLog(2, '2026-03-04')];
      expect(HealthLogEntity.getConditionTrend(logs)).toBe('improving');
    });

    it('2件で悪化', () => {
      const logs = [createLog(2, '2026-03-05'), createLog(4, '2026-03-04')];
      expect(HealthLogEntity.getConditionTrend(logs)).toBe('declining');
    });

    it('途中で上下しても最新と最古で判定する', () => {
      const logs = [
        createLog(5, '2026-03-05'),
        createLog(1, '2026-03-04'),
        createLog(5, '2026-03-03'),
        createLog(3, '2026-03-02'),
      ];
      expect(HealthLogEntity.getConditionTrend(logs)).toBe('improving');
    });
  });

  describe('getWorstDay 追加テスト', () => {
    it('全てレベル5の場合は最初の要素を返す', () => {
      const logs = [
        createLog(5, '2026-03-05'),
        createLog(5, '2026-03-04'),
      ];
      const result = HealthLogEntity.getWorstDay(logs);
      expect(result!.id).toBe('log-2026-03-05');
    });

    it('レベル1が最後にある場合も正しく検知する', () => {
      const logs = [
        createLog(3, '2026-03-05'),
        createLog(4, '2026-03-04'),
        createLog(1, '2026-03-03'),
      ];
      expect(HealthLogEntity.getWorstDay(logs)!.conditionLevel).toBe(1);
    });
  });
});
