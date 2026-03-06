import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Percentile Edge Cases', () => {
  describe('calculatePercentile', () => {
    it('2要素で50パーセンタイルは中間値', () => {
      expect(MathHelper.calculatePercentile([10, 20], 50)).toBe(15);
    });

    it('負のパーセンタイルで最小値を返す', () => {
      expect(MathHelper.calculatePercentile([1, 2, 3], -10)).toBe(1);
    });

    it('100超のパーセンタイルで最大値を返す', () => {
      expect(MathHelper.calculatePercentile([1, 2, 3], 150)).toBe(3);
    });

    it('全て同じ値の配列', () => {
      expect(MathHelper.calculatePercentile([5, 5, 5, 5], 75)).toBe(5);
    });
  });

  describe('getQuartiles', () => {
    it('1要素で全て同じ値', () => {
      const q = MathHelper.getQuartiles([42]);
      expect(q.q1).toBe(42);
      expect(q.q2).toBe(42);
      expect(q.q3).toBe(42);
    });

    it('2要素の四分位数', () => {
      const q = MathHelper.getQuartiles([0, 100]);
      expect(q.q2).toBe(50);
    });
  });

  describe('getOutlierBounds', () => {
    it('全て同じ値でIQR=0', () => {
      const bounds = MathHelper.getOutlierBounds([5, 5, 5]);
      expect(bounds.lower).toBe(5);
      expect(bounds.upper).toBe(5);
    });

    it('1要素でIQR=0', () => {
      const bounds = MathHelper.getOutlierBounds([10]);
      expect(bounds.lower).toBe(10);
      expect(bounds.upper).toBe(10);
    });
  });
});
