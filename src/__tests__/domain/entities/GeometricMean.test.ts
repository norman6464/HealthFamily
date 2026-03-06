import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Geometric Mean', () => {
  describe('getGeometricMean', () => {
    it('空配列は0', () => {
      expect(MathHelper.getGeometricMean([])).toBe(0);
    });

    it('1件のみはその値', () => {
      expect(MathHelper.getGeometricMean([4])).toBe(4);
    });

    it('同じ値はその値', () => {
      expect(MathHelper.getGeometricMean([5, 5, 5])).toBe(5);
    });

    it('2と8の幾何平均は4', () => {
      expect(MathHelper.getGeometricMean([2, 8])).toBe(4);
    });

    it('1, 2, 4の幾何平均', () => {
      expect(MathHelper.getGeometricMean([1, 2, 4])).toBe(2);
    });

    it('0を含む場合は0', () => {
      expect(MathHelper.getGeometricMean([0, 5, 10])).toBe(0);
    });

    it('負の値を含む場合は0', () => {
      expect(MathHelper.getGeometricMean([-1, 5, 10])).toBe(0);
    });

    it('小数点第2位で丸められる', () => {
      const result = MathHelper.getGeometricMean([3, 5, 7]);
      expect(result).toBe(4.72);
    });
  });

  describe('getGeometricMeanLabel', () => {
    it('高い値', () => {
      expect(MathHelper.getGeometricMeanLabel(80)).toBe('高い');
    });

    it('中程度の値', () => {
      expect(MathHelper.getGeometricMeanLabel(50)).toBe('中程度');
    });

    it('低い値', () => {
      expect(MathHelper.getGeometricMeanLabel(20)).toBe('低い');
    });
  });
});
