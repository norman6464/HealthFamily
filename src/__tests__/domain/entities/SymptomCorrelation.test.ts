import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Symptom Correlation', () => {
  describe('getSymptomCooccurrence', () => {
    it('共起ペアを集計する', () => {
      const logs = [
        { symptoms: ['頭痛', '発熱'] },
        { symptoms: ['頭痛', '発熱'] },
        { symptoms: ['咳', '発熱'] },
      ];
      const result = HealthLogEntity.getSymptomCooccurrence(logs);
      expect(result).toContainEqual({ pair: ['発熱', '頭痛'], count: 2 });
      expect(result).toContainEqual({ pair: ['咳', '発熱'], count: 1 });
    });

    it('1症状のみのログは共起なし', () => {
      const logs = [{ symptoms: ['頭痛'] }, { symptoms: ['発熱'] }];
      const result = HealthLogEntity.getSymptomCooccurrence(logs);
      expect(result).toEqual([]);
    });

    it('空配列は空を返す', () => {
      expect(HealthLogEntity.getSymptomCooccurrence([])).toEqual([]);
    });

    it('症状なしのログは無視', () => {
      const logs = [{ symptoms: [] }, { symptoms: ['頭痛', '発熱'] }];
      const result = HealthLogEntity.getSymptomCooccurrence(logs);
      expect(result).toHaveLength(1);
    });
  });

  describe('getMostCommonSymptomPair', () => {
    it('最も多い共起ペアを返す', () => {
      const logs = [
        { symptoms: ['頭痛', '発熱'] },
        { symptoms: ['頭痛', '発熱'] },
        { symptoms: ['咳', '倦怠感'] },
      ];
      const result = HealthLogEntity.getMostCommonSymptomPair(logs);
      expect(result).toEqual({ pair: ['発熱', '頭痛'], count: 2 });
    });

    it('共起がない場合nullを返す', () => {
      const logs = [{ symptoms: ['頭痛'] }];
      expect(HealthLogEntity.getMostCommonSymptomPair(logs)).toBeNull();
    });

    it('空配列はnullを返す', () => {
      expect(HealthLogEntity.getMostCommonSymptomPair([])).toBeNull();
    });
  });

  describe('getSymptomCorrelationLabel', () => {
    it('5回以上で「強い相関」', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(5)).toBe('強い相関');
    });

    it('3回で「中程度の相関」', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(3)).toBe('中程度の相関');
    });

    it('1回で「弱い相関」', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(1)).toBe('弱い相関');
    });

    it('0回で「相関なし」', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(0)).toBe('相関なし');
    });
  });
});
