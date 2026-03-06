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

describe('HealthLogEntity 症状サマリーユーティリティ', () => {
  describe('getSymptomCountSummary', () => {
    it('空配列は空配列を返す', () => {
      expect(HealthLogEntity.getSymptomCountSummary([])).toEqual([]);
    });

    it('全症状の出現回数を多い順に返す', () => {
      const logs = [
        createLog(3, ['headache', 'fever']),
        createLog(2, ['headache', 'fatigue']),
        createLog(4, ['headache']),
      ];
      const result = HealthLogEntity.getSymptomCountSummary(logs);
      expect(result[0]).toEqual({ symptom: 'headache', label: '頭痛', count: 3 });
      expect(result[1].count).toBe(1);
    });

    it('症状がないログは集計に含まれない', () => {
      const logs = [createLog(5, []), createLog(3, ['fever'])];
      const result = HealthLogEntity.getSymptomCountSummary(logs);
      expect(result).toHaveLength(1);
      expect(result[0].symptom).toBe('fever');
    });
  });

  describe('getSymptomLabels', () => {
    it('空配列は空配列を返す', () => {
      expect(HealthLogEntity.getSymptomLabels([])).toEqual([]);
    });

    it('症状コードを日本語ラベルに変換する', () => {
      const result = HealthLogEntity.getSymptomLabels(['headache', 'fever', 'fatigue']);
      expect(result).toEqual(['頭痛', '発熱', '倦怠感']);
    });

    it('全ての症状コードを変換できる', () => {
      const all: SymptomType[] = [
        'headache', 'fever', 'fatigue', 'nausea', 'stomachache',
        'dizziness', 'cough', 'runny_nose', 'joint_pain', 'insomnia',
      ];
      const result = HealthLogEntity.getSymptomLabels(all);
      expect(result).toHaveLength(10);
      expect(result.every((l) => typeof l === 'string' && l.length > 0)).toBe(true);
    });
  });

  describe('formatConditionSummary', () => {
    it('症状なしの場合は体調のみ', () => {
      expect(HealthLogEntity.formatConditionSummary(4, [])).toBe('体調: 良い');
    });

    it('症状ありの場合は体調と症状', () => {
      expect(HealthLogEntity.formatConditionSummary(2, ['headache', 'fever'])).toBe(
        '体調: 悪い / 頭痛, 発熱',
      );
    });

    it('体調レベル5は最高', () => {
      expect(HealthLogEntity.formatConditionSummary(5, [])).toBe('体調: とても良い');
    });

    it('体調レベル1は最悪', () => {
      expect(HealthLogEntity.formatConditionSummary(1, [])).toBe('体調: とても悪い');
    });

    it('体調レベル3は普通', () => {
      expect(HealthLogEntity.formatConditionSummary(3, [])).toBe('体調: 普通');
    });
  });
});
