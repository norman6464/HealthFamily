import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Symptom Diversity Edge Cases', () => {
  describe('getSymptomDiversity', () => {
    it('totalKnownSymptomsが0は0', () => {
      expect(HealthLogEntity.getSymptomDiversity(['a'], 0)).toBe(0);
    });

    it('ユニーク数がtotalを超える場合は100以下', () => {
      const symptoms = ['a', 'b', 'c', 'd', 'e'];
      expect(HealthLogEntity.getSymptomDiversity(symptoms, 3)).toBe(100);
    });

    it('1種類のみ', () => {
      expect(HealthLogEntity.getSymptomDiversity(['a'], 10)).toBe(10);
    });

    it('全種類ある場合は100', () => {
      const symptoms = Array.from({ length: 10 }, (_, i) => `s${i}`);
      expect(HealthLogEntity.getSymptomDiversity(symptoms, 10)).toBe(100);
    });
  });

  describe('getSymptomDiversityLabel', () => {
    it('境界値70は多様', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(70)).toBe('多様');
    });

    it('境界値69は中程度', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(69)).toBe('中程度');
    });

    it('境界値30は中程度', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(30)).toBe('中程度');
    });

    it('境界値29は限定的', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(29)).toBe('限定的');
    });

    it('100は多様', () => {
      expect(HealthLogEntity.getSymptomDiversityLabel(100)).toBe('多様');
    });
  });
});
