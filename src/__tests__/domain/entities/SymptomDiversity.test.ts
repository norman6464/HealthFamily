import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Symptom Diversity', () => {
  describe('getSymptomDiversity', () => {
    it('多種類の症状は高スコア', () => {
      const symptoms = ['headache', 'fever', 'cough', 'fatigue', 'nausea'];
      const score = HealthLogEntity.getSymptomDiversity(symptoms, 10);
      expect(score).toBeGreaterThan(30);
    });

    it('同じ症状のみは低スコア', () => {
      const symptoms = ['headache', 'headache', 'headache'];
      const score = HealthLogEntity.getSymptomDiversity(symptoms, 10);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('空配列は0', () => {
      expect(HealthLogEntity.getSymptomDiversity([], 10)).toBe(0);
    });

    it('スコアは0-100の範囲', () => {
      const symptoms = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
      const score = HealthLogEntity.getSymptomDiversity(symptoms, 10);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getSymptomDiversityLabel', () => {
    it('70以上は多様', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(70)).toBe('多様');
    });

    it('30以上は中程度', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(30)).toBe('中程度');
    });

    it('30未満は限定的', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(29)).toBe('限定的');
    });

    it('0は限定的', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(0)).toBe('限定的');
    });
  });
});
