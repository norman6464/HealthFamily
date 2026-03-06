import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Symptom Summary Edge Cases', () => {
  describe('getSymptomFrequency 境界値', () => {
    it('全て同じ症状の場合1エントリ', () => {
      const symptoms = ['頭痛', '頭痛', '頭痛', '頭痛', '頭痛'];
      const result = HealthLogEntity.getSymptomFrequency(symptoms);
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(5);
    });

    it('大量の種類がある場合', () => {
      const symptoms = Array.from({ length: 50 }, (_, i) => `症状${i}`);
      const result = HealthLogEntity.getSymptomFrequency(symptoms);
      expect(result).toHaveLength(50);
      expect(result.every(r => r.count === 1)).toBe(true);
    });
  });

  describe('getSymptomCountLabel 境界値', () => {
    it('非常に大きい数は「重度」', () => {
      expect(HealthLogEntity.getSymptomCountLabel(100)).toBe('重度');
    });
  });

  describe('getMostCommonSymptom 境界値', () => {
    it('1件のみの場合その症状を返す', () => {
      expect(HealthLogEntity.getMostCommonSymptom(['発熱'])).toBe('発熱');
    });

    it('大量のデータでも正しく動作', () => {
      const symptoms = Array.from({ length: 1000 }, () => '頭痛');
      symptoms.push('発熱');
      expect(HealthLogEntity.getMostCommonSymptom(symptoms)).toBe('頭痛');
    });
  });
});
