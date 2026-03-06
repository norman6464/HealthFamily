import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Symptom Correlation Edge Cases', () => {
  describe('getSymptomCooccurrence', () => {
    it('3症状で3ペアを生成', () => {
      const logs = [{ symptoms: ['頭痛', '発熱', '咳'] }];
      const result = HealthLogEntity.getSymptomCooccurrence(logs);
      expect(result).toHaveLength(3);
    });

    it('同じ症状ペアが複数ログに出現', () => {
      const logs = [
        { symptoms: ['A', 'B', 'C'] },
        { symptoms: ['A', 'B'] },
        { symptoms: ['A', 'C'] },
      ];
      const result = HealthLogEntity.getSymptomCooccurrence(logs);
      const abPair = result.find((r) => r.pair.includes('A') && r.pair.includes('B'));
      expect(abPair?.count).toBe(2);
    });

    it('ソートされた順序で返される', () => {
      const logs = [
        { symptoms: ['X', 'Y'] },
        { symptoms: ['A', 'B'] },
        { symptoms: ['A', 'B'] },
      ];
      const result = HealthLogEntity.getSymptomCooccurrence(logs);
      expect(result[0].count).toBeGreaterThanOrEqual(result[result.length - 1].count);
    });
  });

  describe('getMostCommonSymptomPair', () => {
    it('全て同頻度なら最初のペアを返す', () => {
      const logs = [
        { symptoms: ['A', 'B'] },
        { symptoms: ['C', 'D'] },
      ];
      const result = HealthLogEntity.getMostCommonSymptomPair(logs);
      expect(result?.count).toBe(1);
    });
  });

  describe('getSymptomCorrelationLabel', () => {
    it('境界値5で「強い相関」', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(5)).toBe('強い相関');
    });

    it('境界値4で「中程度の相関」', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(4)).toBe('中程度の相関');
    });

    it('境界値3で「中程度の相関」', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(3)).toBe('中程度の相関');
    });

    it('境界値2で「弱い相関」', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(2)).toBe('弱い相関');
    });

    it('大量の共起', () => {
      expect(HealthLogEntity.getSymptomCorrelationLabel(100)).toBe('強い相関');
    });
  });
});
