import { describe, it, expect } from 'vitest';
import { HealthLogEntity, HealthLog, ConditionLevel, SymptomType } from '@/domain/entities/HealthLog';

const createLog = (overrides: Partial<HealthLog> & { conditionLevel: ConditionLevel; recordedAt: Date }): HealthLog => ({
  id: 'log-1',
  memberId: 'member-1',
  memberName: '太郎',
  userId: 'user-1',
  symptoms: [],
  ...overrides,
});

describe('HealthLogEntity 週間体調サマリー', () => {
  describe('getWeeklySummary', () => {
    it('空配列はデフォルト値を返す', () => {
      const result = HealthLogEntity.getWeeklySummary([]);
      expect(result.totalLogs).toBe(0);
      expect(result.averageCondition).toBeNull();
      expect(result.topSymptom).toBeNull();
    });

    it('記録ありの場合に正しく集計する', () => {
      const logs = [
        createLog({ conditionLevel: 4, recordedAt: new Date('2026-03-05'), symptoms: ['headache'] as SymptomType[] }),
        createLog({ conditionLevel: 2, recordedAt: new Date('2026-03-04'), symptoms: ['headache', 'fever'] as SymptomType[] }),
        createLog({ conditionLevel: 3, recordedAt: new Date('2026-03-03'), symptoms: ['fever'] as SymptomType[] }),
      ];
      const result = HealthLogEntity.getWeeklySummary(logs);
      expect(result.totalLogs).toBe(3);
      expect(result.averageCondition).toBe(3);
    });

    it('最多症状を正しく返す', () => {
      const logs = [
        createLog({ conditionLevel: 3, recordedAt: new Date(), symptoms: ['headache', 'fever'] as SymptomType[] }),
        createLog({ conditionLevel: 3, recordedAt: new Date(), symptoms: ['headache'] as SymptomType[] }),
      ];
      const result = HealthLogEntity.getWeeklySummary(logs);
      expect(result.topSymptom).toBe('headache');
    });

    it('症状なしの場合はtopSymptomがnull', () => {
      const logs = [
        createLog({ conditionLevel: 3, recordedAt: new Date() }),
      ];
      const result = HealthLogEntity.getWeeklySummary(logs);
      expect(result.topSymptom).toBeNull();
    });
  });

  describe('getConditionChangeRate', () => {
    it('前週より改善の場合は正の値', () => {
      expect(HealthLogEntity.getConditionChangeRate(4.0, 3.0)).toBe(33);
    });

    it('前週より悪化の場合は負の値', () => {
      expect(HealthLogEntity.getConditionChangeRate(2.0, 4.0)).toBe(-50);
    });

    it('変化なしは0を返す', () => {
      expect(HealthLogEntity.getConditionChangeRate(3.0, 3.0)).toBe(0);
    });

    it('前週データなし(0)は0を返す', () => {
      expect(HealthLogEntity.getConditionChangeRate(3.0, 0)).toBe(0);
    });

    it('今週データなし(0)で前週あり', () => {
      expect(HealthLogEntity.getConditionChangeRate(0, 3.0)).toBe(-100);
    });
  });
});
