import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Date Cluster Analysis', () => {
  describe('getDateClusterAnalysis', () => {
    it('空配列は0', () => {
      expect(DateRangeHelper.getDateClusterAnalysis([])).toBe(0);
    });

    it('1件のみは100', () => {
      expect(DateRangeHelper.getDateClusterAnalysis([1])).toBe(100);
    });

    it('全て1日間隔は高スコア', () => {
      expect(DateRangeHelper.getDateClusterAnalysis([1, 1, 1, 1])).toBe(97);
    });

    it('大きな間隔はスコアが下がる', () => {
      const result = DateRangeHelper.getDateClusterAnalysis([1, 30, 1, 30]);
      expect(result).toBeLessThan(100);
    });

    it('全て同じ間隔', () => {
      const result = DateRangeHelper.getDateClusterAnalysis([7, 7, 7, 7]);
      expect(result).toBeGreaterThan(0);
    });

    it('極端に疎らな場合', () => {
      const result = DateRangeHelper.getDateClusterAnalysis([90, 90, 90]);
      expect(result).toBeLessThan(30);
    });
  });

  describe('getClusterLabel', () => {
    it('高密度', () => {
      expect(DateRangeHelper.getClusterLabel(80)).toBe('密集');
    });

    it('中程度', () => {
      expect(DateRangeHelper.getClusterLabel(50)).toBe('中程度');
    });

    it('疎ら', () => {
      expect(DateRangeHelper.getClusterLabel(20)).toBe('疎ら');
    });
  });
});
