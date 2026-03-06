import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Geometric Mean Edge Cases', () => {
  describe('getGeometricMean', () => {
    it('全て1は1', () => {
      expect(MathHelper.getGeometricMean([1, 1, 1])).toBe(1);
    });

    it('大きな値', () => {
      expect(MathHelper.getGeometricMean([100, 100, 100])).toBe(100);
    });

    it('小数値', () => {
      expect(MathHelper.getGeometricMean([0.5, 2])).toBe(1);
    });

    it('非常に小さい正の値', () => {
      const result = MathHelper.getGeometricMean([0.01, 0.01]);
      expect(result).toBe(0.01);
    });

    it('1件で0は0', () => {
      expect(MathHelper.getGeometricMean([0])).toBe(0);
    });

    it('2件で片方0は0', () => {
      expect(MathHelper.getGeometricMean([100, 0])).toBe(0);
    });

    it('負の値のみは0', () => {
      expect(MathHelper.getGeometricMean([-5, -3])).toBe(0);
    });

    it('大量データ', () => {
      const values = Array.from({ length: 100 }, () => 10);
      expect(MathHelper.getGeometricMean(values)).toBe(10);
    });
  });

  describe('getGeometricMeanLabel', () => {
    it('70は高い（閾値境界）', () => {
      expect(MathHelper.getGeometricMeanLabel(70)).toBe('高い');
    });

    it('69は中程度', () => {
      expect(MathHelper.getGeometricMeanLabel(69)).toBe('中程度');
    });

    it('30は中程度（閾値境界）', () => {
      expect(MathHelper.getGeometricMeanLabel(30)).toBe('中程度');
    });

    it('29は低い', () => {
      expect(MathHelper.getGeometricMeanLabel(29)).toBe('低い');
    });

    it('0は低い', () => {
      expect(MathHelper.getGeometricMeanLabel(0)).toBe('低い');
    });

    it('100は高い', () => {
      expect(MathHelper.getGeometricMeanLabel(100)).toBe('高い');
    });
  });
});
