import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Outlier Count Edge Cases', () => {
  describe('getOutlierCount', () => {
    it('2件のみは外れ値なし', () => {
      expect(MathHelper.getOutlierCount([1, 100])).toBe(0);
    });

    it('3件で外れ値なし', () => {
      expect(MathHelper.getOutlierCount([10, 11, 12])).toBe(0);
    });

    it('負の値を含む配列', () => {
      expect(MathHelper.getOutlierCount([-100, 1, 2, 3, 4, 5])).toBe(1);
    });

    it('全て負の値', () => {
      expect(MathHelper.getOutlierCount([-5, -4, -3, -2, -1])).toBe(0);
    });

    it('小数値の配列', () => {
      expect(MathHelper.getOutlierCount([1.1, 1.2, 1.3, 1.4, 100.5])).toBe(1);
    });

    it('0を含む配列', () => {
      expect(MathHelper.getOutlierCount([0, 0, 0, 0, 100])).toBe(1);
    });

    it('大きな値の配列', () => {
      expect(MathHelper.getOutlierCount([1000, 1001, 1002, 1003, 9999])).toBe(1);
    });

    it('IQR境界上の値は外れ値ではない', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const count = MathHelper.getOutlierCount(values);
      expect(count).toBe(0);
    });

    it('2件の同一値', () => {
      expect(MathHelper.getOutlierCount([5, 5])).toBe(0);
    });

    it('大量データで外れ値検出', () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      values.push(10000);
      expect(MathHelper.getOutlierCount(values)).toBeGreaterThan(0);
    });
  });

  describe('getOutlierSeverityLabel', () => {
    it('外れ値率ちょうど20%は深刻', () => {
      expect(MathHelper.getOutlierSeverityLabel(2, 10)).toBe('深刻');
    });

    it('外れ値率ちょうど5%は軽微', () => {
      expect(MathHelper.getOutlierSeverityLabel(1, 20)).toBe('軽微');
    });

    it('外れ値率5%未満は正常', () => {
      expect(MathHelper.getOutlierSeverityLabel(1, 100)).toBe('正常');
    });

    it('全件外れ値は深刻', () => {
      expect(MathHelper.getOutlierSeverityLabel(10, 10)).toBe('深刻');
    });

    it('外れ値1件で全体1件は深刻', () => {
      expect(MathHelper.getOutlierSeverityLabel(1, 1)).toBe('深刻');
    });

    it('外れ値が全体より多くても深刻', () => {
      expect(MathHelper.getOutlierSeverityLabel(20, 10)).toBe('深刻');
    });
  });
});
