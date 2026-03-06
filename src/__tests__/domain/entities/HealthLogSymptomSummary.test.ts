import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Symptom Summary', () => {
  describe('getSymptomFrequency', () => {
    it('症状別の出現頻度を降順で返す', () => {
      const symptoms = ['頭痛', '発熱', '頭痛', '咳', '頭痛', '発熱'];
      const result = HealthLogEntity.getSymptomFrequency(symptoms);
      expect(result).toEqual([
        { symptom: '頭痛', count: 3 },
        { symptom: '発熱', count: 2 },
        { symptom: '咳', count: 1 },
      ]);
    });

    it('空配列は空配列を返す', () => {
      expect(HealthLogEntity.getSymptomFrequency([])).toEqual([]);
    });

    it('1種類のみの場合', () => {
      const result = HealthLogEntity.getSymptomFrequency(['頭痛', '頭痛']);
      expect(result).toEqual([{ symptom: '頭痛', count: 2 }]);
    });
  });

  describe('getSymptomCountLabel', () => {
    it('0は「症状なし」', () => {
      expect(HealthLogEntity.getSymptomCountLabel(0)).toBe('症状なし');
    });

    it('1は「軽度」', () => {
      expect(HealthLogEntity.getSymptomCountLabel(1)).toBe('軽度');
    });

    it('2は「軽度」', () => {
      expect(HealthLogEntity.getSymptomCountLabel(2)).toBe('軽度');
    });

    it('3は「中度」', () => {
      expect(HealthLogEntity.getSymptomCountLabel(3)).toBe('中度');
    });

    it('4は「中度」', () => {
      expect(HealthLogEntity.getSymptomCountLabel(4)).toBe('中度');
    });

    it('5は「重度」', () => {
      expect(HealthLogEntity.getSymptomCountLabel(5)).toBe('重度');
    });
  });

  describe('getMostCommonSymptom', () => {
    it('最も頻度が高い症状を返す', () => {
      const symptoms = ['頭痛', '発熱', '頭痛'];
      expect(HealthLogEntity.getMostCommonSymptom(symptoms)).toBe('頭痛');
    });

    it('空配列はnullを返す', () => {
      expect(HealthLogEntity.getMostCommonSymptom([])).toBeNull();
    });

    it('全て同数の場合は最初に出現した症状を返す', () => {
      const symptoms = ['頭痛', '発熱', '咳'];
      const result = HealthLogEntity.getMostCommonSymptom(symptoms);
      expect(result).toBe('頭痛');
    });
  });
});
