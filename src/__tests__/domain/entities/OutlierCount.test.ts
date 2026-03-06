import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Outlier Count', () => {
  describe('getOutlierCount', () => {
    it('空配列は0', () => {
      expect(MathHelper.getOutlierCount([])).toBe(0);
    });

    it('外れ値なし', () => {
      expect(MathHelper.getOutlierCount([10, 11, 12, 13, 14])).toBe(0);
    });

    it('外れ値あり', () => {
      expect(MathHelper.getOutlierCount([10, 11, 12, 13, 100])).toBe(1);
    });

    it('複数の外れ値', () => {
      expect(MathHelper.getOutlierCount([1, 10, 11, 12, 13, 100])).toBe(2);
    });

    it('全て同じ値は外れ値なし', () => {
      expect(MathHelper.getOutlierCount([5, 5, 5, 5, 5])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(MathHelper.getOutlierCount([42])).toBe(0);
    });
  });

  describe('getOutlierSeverityLabel', () => {
    it('外れ値なし', () => {
      expect(MathHelper.getOutlierSeverityLabel(0, 10)).toBe('正常');
    });

    it('少数の外れ値', () => {
      expect(MathHelper.getOutlierSeverityLabel(1, 20)).toBe('軽微');
    });

    it('多数の外れ値', () => {
      expect(MathHelper.getOutlierSeverityLabel(5, 10)).toBe('深刻');
    });

    it('データなし', () => {
      expect(MathHelper.getOutlierSeverityLabel(0, 0)).toBe('正常');
    });
  });
});
