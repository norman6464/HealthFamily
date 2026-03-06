import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Date Cluster Analysis Edge Cases', () => {
  describe('getDateClusterAnalysis', () => {
    it('間隔0のみは100', () => {
      expect(DateRangeHelper.getDateClusterAnalysis([0, 0, 0])).toBe(100);
    });

    it('間隔30は0', () => {
      expect(DateRangeHelper.getDateClusterAnalysis([30, 30, 30])).toBe(0);
    });

    it('間隔30超は0にクランプ', () => {
      expect(DateRangeHelper.getDateClusterAnalysis([60, 60])).toBe(0);
    });

    it('2件で小さい間隔', () => {
      const result = DateRangeHelper.getDateClusterAnalysis([3, 3]);
      expect(result).toBe(90);
    });

    it('大量データで一定間隔', () => {
      const intervals = Array(100).fill(7);
      const result = DateRangeHelper.getDateClusterAnalysis(intervals);
      expect(result).toBe(77);
    });

    it('混在した間隔', () => {
      const result = DateRangeHelper.getDateClusterAnalysis([1, 7, 1, 14]);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });
  });

  describe('getClusterLabel', () => {
    it('境界値70は密集', () => {
      expect(DateRangeHelper.getClusterLabel(70)).toBe('密集');
    });

    it('境界値69は中程度', () => {
      expect(DateRangeHelper.getClusterLabel(69)).toBe('中程度');
    });

    it('境界値40は中程度', () => {
      expect(DateRangeHelper.getClusterLabel(40)).toBe('中程度');
    });

    it('境界値39は疎ら', () => {
      expect(DateRangeHelper.getClusterLabel(39)).toBe('疎ら');
    });

    it('0は疎ら', () => {
      expect(DateRangeHelper.getClusterLabel(0)).toBe('疎ら');
    });

    it('100は密集', () => {
      expect(DateRangeHelper.getClusterLabel(100)).toBe('密集');
    });
  });
});
