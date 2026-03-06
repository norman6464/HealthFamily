import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Percentile', () => {
  describe('calculatePercentile', () => {
    const data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    it('50パーセンタイルで中央値を返す', () => {
      expect(MathHelper.calculatePercentile(data, 50)).toBe(55);
    });

    it('0パーセンタイルで最小値を返す', () => {
      expect(MathHelper.calculatePercentile(data, 0)).toBe(10);
    });

    it('100パーセンタイルで最大値を返す', () => {
      expect(MathHelper.calculatePercentile(data, 100)).toBe(100);
    });

    it('25パーセンタイル', () => {
      expect(MathHelper.calculatePercentile(data, 25)).toBe(32.5);
    });

    it('空配列で0を返す', () => {
      expect(MathHelper.calculatePercentile([], 50)).toBe(0);
    });

    it('1要素でその値を返す', () => {
      expect(MathHelper.calculatePercentile([42], 50)).toBe(42);
    });
  });

  describe('getQuartiles', () => {
    it('四分位数を正しく返す', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const q = MathHelper.getQuartiles(data);
      expect(q.q1).toBe(3.25);
      expect(q.q2).toBe(5.5);
      expect(q.q3).toBe(7.75);
    });

    it('空配列で全て0を返す', () => {
      const q = MathHelper.getQuartiles([]);
      expect(q.q1).toBe(0);
      expect(q.q2).toBe(0);
      expect(q.q3).toBe(0);
    });
  });

  describe('getOutlierBounds', () => {
    it('IQRに基づく境界を返す', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const bounds = MathHelper.getOutlierBounds(data);
      const q = MathHelper.getQuartiles(data);
      const iqr = q.q3 - q.q1;
      expect(bounds.lower).toBe(q.q1 - 1.5 * iqr);
      expect(bounds.upper).toBe(q.q3 + 1.5 * iqr);
    });

    it('空配列で0/0を返す', () => {
      const bounds = MathHelper.getOutlierBounds([]);
      expect(bounds.lower).toBe(0);
      expect(bounds.upper).toBe(0);
    });

    it('外れ値を検出できる', () => {
      const data = [10, 12, 11, 13, 12, 11, 100];
      const bounds = MathHelper.getOutlierBounds(data);
      expect(100).toBeGreaterThan(bounds.upper);
    });
  });
});
