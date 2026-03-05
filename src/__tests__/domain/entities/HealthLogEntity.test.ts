import { describe, it, expect } from 'vitest';
import {
  HealthLogEntity,
  HealthLog,
  ConditionLevel,
  SYMPTOM_OPTIONS,
} from '@/domain/entities/HealthLog';

describe('HealthLogEntity', () => {
  const createLog = (overrides: Partial<HealthLog> = {}): HealthLog => ({
    id: 'log-1',
    memberId: 'member-1',
    memberName: 'テスト太郎',
    userId: 'user-1',
    conditionLevel: 3 as ConditionLevel,
    symptoms: [],
    notes: undefined,
    recordedAt: new Date('2026-03-05T10:00:00'),
    ...overrides,
  });

  describe('getConditionLabel', () => {
    it('各レベルに対応するラベルを返す', () => {
      expect(HealthLogEntity.getConditionLabel(1)).toBe('とても悪い');
      expect(HealthLogEntity.getConditionLabel(2)).toBe('悪い');
      expect(HealthLogEntity.getConditionLabel(3)).toBe('普通');
      expect(HealthLogEntity.getConditionLabel(4)).toBe('良い');
      expect(HealthLogEntity.getConditionLabel(5)).toBe('とても良い');
    });
  });

  describe('getConditionColor', () => {
    it('レベル1は赤色を返す', () => {
      expect(HealthLogEntity.getConditionColor(1)).toBe('text-red-600');
    });

    it('レベル5は緑色を返す', () => {
      expect(HealthLogEntity.getConditionColor(5)).toBe('text-green-600');
    });
  });

  describe('getSymptomLabel', () => {
    it('症状の日本語ラベルを返す', () => {
      expect(HealthLogEntity.getSymptomLabel('headache')).toBe('頭痛');
      expect(HealthLogEntity.getSymptomLabel('fever')).toBe('発熱');
      expect(HealthLogEntity.getSymptomLabel('fatigue')).toBe('倦怠感');
    });

    it('全ての症状にラベルが定義されている', () => {
      for (const symptom of SYMPTOM_OPTIONS) {
        expect(HealthLogEntity.getSymptomLabel(symptom)).toBeTruthy();
      }
    });
  });

  describe('groupByDate', () => {
    it('記録を日付ごとにグループ化する', () => {
      const logs = [
        createLog({ id: '1', recordedAt: new Date('2026-03-05T10:00:00') }),
        createLog({ id: '2', recordedAt: new Date('2026-03-05T14:00:00') }),
        createLog({ id: '3', recordedAt: new Date('2026-03-04T09:00:00') }),
      ];

      const groups = HealthLogEntity.groupByDate(logs);
      expect(groups).toHaveLength(2);
      expect(groups[0].date).toBe('2026-03-05');
      expect(groups[0].logs).toHaveLength(2);
      expect(groups[1].date).toBe('2026-03-04');
      expect(groups[1].logs).toHaveLength(1);
    });

    it('新しい日付順にソートされる', () => {
      const logs = [
        createLog({ id: '1', recordedAt: new Date('2026-03-01T10:00:00') }),
        createLog({ id: '2', recordedAt: new Date('2026-03-05T10:00:00') }),
        createLog({ id: '3', recordedAt: new Date('2026-03-03T10:00:00') }),
      ];

      const groups = HealthLogEntity.groupByDate(logs);
      expect(groups[0].date).toBe('2026-03-05');
      expect(groups[1].date).toBe('2026-03-03');
      expect(groups[2].date).toBe('2026-03-01');
    });

    it('空配列の場合は空配列を返す', () => {
      expect(HealthLogEntity.groupByDate([])).toEqual([]);
    });
  });

  describe('getAverageCondition', () => {
    it('平均体調レベルを算出する', () => {
      const logs = [
        createLog({ conditionLevel: 3 as ConditionLevel }),
        createLog({ conditionLevel: 4 as ConditionLevel }),
        createLog({ conditionLevel: 5 as ConditionLevel }),
      ];

      expect(HealthLogEntity.getAverageCondition(logs)).toBe(4);
    });

    it('小数点第1位まで丸める', () => {
      const logs = [
        createLog({ conditionLevel: 3 as ConditionLevel }),
        createLog({ conditionLevel: 4 as ConditionLevel }),
        createLog({ conditionLevel: 4 as ConditionLevel }),
      ];

      expect(HealthLogEntity.getAverageCondition(logs)).toBe(3.7);
    });

    it('空配列の場合は0を返す', () => {
      expect(HealthLogEntity.getAverageCondition([])).toBe(0);
    });
  });

  describe('getMostFrequentSymptoms', () => {
    it('頻度の高い症状順に返す', () => {
      const logs = [
        createLog({ symptoms: ['headache', 'fever'] }),
        createLog({ symptoms: ['headache', 'fatigue'] }),
        createLog({ symptoms: ['headache'] }),
      ];

      const result = HealthLogEntity.getMostFrequentSymptoms(logs);
      expect(result[0]).toEqual({ symptom: 'headache', count: 3 });
      expect(result[1].count).toBeLessThanOrEqual(result[0].count);
    });

    it('limitで取得数を制限できる', () => {
      const logs = [
        createLog({ symptoms: ['headache', 'fever', 'fatigue', 'nausea'] }),
      ];

      const result = HealthLogEntity.getMostFrequentSymptoms(logs, 2);
      expect(result).toHaveLength(2);
    });

    it('症状がない場合は空配列を返す', () => {
      const logs = [createLog({ symptoms: [] })];
      expect(HealthLogEntity.getMostFrequentSymptoms(logs)).toEqual([]);
    });
  });

  describe('formatDate', () => {
    it('日本語形式でフォーマットする', () => {
      const result = HealthLogEntity.formatDate('2026-03-05');
      expect(result).toMatch(/3月5日/);
    });
  });
});
