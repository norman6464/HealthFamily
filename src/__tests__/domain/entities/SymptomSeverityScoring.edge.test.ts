import { describe, it, expect } from 'vitest';
import { HealthLogEntity, HealthLog, ConditionLevel, SymptomType } from '@/domain/entities/HealthLog';

const createLog = (
  conditionLevel: ConditionLevel,
  symptoms: SymptomType[],
): HealthLog => ({
  id: `log-${Math.random()}`,
  memberId: 'member-1',
  memberName: '太郎',
  userId: 'user-1',
  conditionLevel,
  symptoms,
  notes: '',
  recordedAt: new Date('2026-03-01'),
});

describe('SymptomSeverityScoring エッジケース', () => {
  describe('getSymptomSeverityScore エッジケース', () => {
    it('体調レベル3は低体調に含まれない', () => {
      const logs = [createLog(3, ['headache'])];
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'headache')).toBe(0);
    });

    it('体調レベル2は低体調に含まれる', () => {
      const logs = [createLog(2, ['headache'])];
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'headache')).toBe(100);
    });

    it('複数症状を持つログも正しくカウントされる', () => {
      const logs = [
        createLog(1, ['headache', 'fever', 'fatigue']),
        createLog(5, ['headache']),
      ];
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'headache')).toBe(50);
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'fever')).toBe(100);
    });

    it('全体調レベルで出現する症状の正確なスコア', () => {
      const logs = [
        createLog(1, ['headache']),
        createLog(2, ['headache']),
        createLog(3, ['headache']),
        createLog(4, ['headache']),
        createLog(5, ['headache']),
      ];
      expect(HealthLogEntity.getSymptomSeverityScore(logs, 'headache')).toBe(40);
    });
  });

  describe('getSymptomRiskLevel 境界値', () => {
    it('スコア49はlowを返す', () => {
      expect(HealthLogEntity.getSymptomRiskLevel(49)).toBe('low');
    });

    it('スコア79はmediumを返す', () => {
      expect(HealthLogEntity.getSymptomRiskLevel(79)).toBe('medium');
    });
  });

  describe('getMostSevereSymptom エッジケース', () => {
    it('全症状が同スコアの場合いずれかを返す', () => {
      const logs = [
        createLog(1, ['headache', 'fever']),
      ];
      const result = HealthLogEntity.getMostSevereSymptom(logs);
      expect(result).not.toBeNull();
      expect(result!.score).toBe(100);
    });

    it('1件のログの全症状を分析する', () => {
      const logs = [createLog(4, ['headache', 'fever', 'fatigue'])];
      const result = HealthLogEntity.getMostSevereSymptom(logs);
      expect(result!.score).toBe(0);
    });
  });
});
