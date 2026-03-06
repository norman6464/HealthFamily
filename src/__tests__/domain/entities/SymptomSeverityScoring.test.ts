import { describe, it, expect } from 'vitest';
import { HealthLogEntity, HealthLog, ConditionLevel, SymptomType } from '@/domain/entities/HealthLog';

const createLog = (
  conditionLevel: ConditionLevel,
  symptoms: SymptomType[],
  overrides: Partial<HealthLog> = {},
): HealthLog => ({
  id: `log-${Math.random()}`,
  memberId: 'member-1',
  memberName: '太郎',
  userId: 'user-1',
  conditionLevel,
  symptoms,
  notes: '',
  recordedAt: new Date('2026-03-01'),
  ...overrides,
});

describe('HealthLogEntity 症状深刻度スコアリング', () => {
  describe('getSymptomSeverityScore', () => {
    it('空配列は0を返す', () => {
      expect(HealthLogEntity.getSymptomSeverityScore([], 'headache')).toBe(0);
    });

    it('該当症状がない場合は0を返す', () => {
      const logs = [createLog(1, ['fever']), createLog(2, ['fatigue'])];
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'headache')).toBe(0);
    });

    it('低体調時のみに出現する症状は100を返す', () => {
      const logs = [
        createLog(1, ['headache']),
        createLog(2, ['headache']),
        createLog(4, ['fatigue']),
        createLog(5, []),
      ];
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'headache')).toBe(100);
    });

    it('高体調時のみに出現する症状は0を返す', () => {
      const logs = [
        createLog(4, ['headache']),
        createLog(5, ['headache']),
        createLog(1, ['fever']),
      ];
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'headache')).toBe(0);
    });

    it('半分が低体調時の場合50を返す', () => {
      const logs = [
        createLog(1, ['headache']),
        createLog(4, ['headache']),
      ];
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'headache')).toBe(50);
    });
  });

  describe('getSymptomRiskLevel', () => {
    it('スコア0はlowを返す', () => {
      expect(HealthLogEntity.getSymptomRiskLevel(0)).toBe('low');
    });

    it('スコア30はlowを返す', () => {
      expect(HealthLogEntity.getSymptomRiskLevel(30)).toBe('low');
    });

    it('スコア50はmediumを返す', () => {
      expect(HealthLogEntity.getSymptomRiskLevel(50)).toBe('medium');
    });

    it('スコア70はmediumを返す', () => {
      expect(HealthLogEntity.getSymptomRiskLevel(70)).toBe('medium');
    });

    it('スコア80はhighを返す', () => {
      expect(HealthLogEntity.getSymptomRiskLevel(80)).toBe('high');
    });

    it('スコア100はhighを返す', () => {
      expect(HealthLogEntity.getSymptomRiskLevel(100)).toBe('high');
    });
  });

  describe('getMostSevereSymptom', () => {
    it('空配列はnullを返す', () => {
      expect(HealthLogEntity.getMostSevereSymptom([])).toBeNull();
    });

    it('最も深刻度が高い症状を返す', () => {
      const logs = [
        createLog(1, ['headache', 'fever']),
        createLog(2, ['headache']),
        createLog(4, ['fever']),
        createLog(5, ['fatigue']),
      ];
      const result = HealthLogEntity.getMostSevereSymptom(logs);
      expect(result!.symptom).toBe('headache');
      expect(result!.score).toBe(100);
    });

    it('症状がない場合はnullを返す', () => {
      const logs = [createLog(3, []), createLog(4, [])];
      expect(HealthLogEntity.getMostSevereSymptom(logs)).toBeNull();
    });
  });
});
