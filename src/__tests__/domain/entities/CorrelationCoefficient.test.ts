import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Correlation Coefficient', () => {
  describe('getCorrelationCoefficient', () => {
    it('空配列は0', () => {
      expect(MathHelper.getCorrelationCoefficient([], [])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(MathHelper.getCorrelationCoefficient([1], [2])).toBe(0);
    });

    it('完全正相関は1', () => {
      expect(MathHelper.getCorrelationCoefficient([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBe(1);
    });

    it('完全負相関は-1', () => {
      expect(MathHelper.getCorrelationCoefficient([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBe(-1);
    });

    it('無相関は0付近', () => {
      const result = MathHelper.getCorrelationCoefficient([1, 2, 3, 4, 5], [3, 1, 4, 1, 5]);
      expect(Math.abs(result)).toBeLessThan(0.5);
    });

    it('長さが異なる場合は短い方に合わせる', () => {
      const result = MathHelper.getCorrelationCoefficient([1, 2, 3], [2, 4, 6, 8]);
      expect(result).toBe(1);
    });

    it('全て同じ値は0', () => {
      expect(MathHelper.getCorrelationCoefficient([5, 5, 5], [3, 3, 3])).toBe(0);
    });
  });

  describe('getCorrelationLabel', () => {
    it('強い正相関', () => {
      expect(MathHelper.getCorrelationLabel(0.8)).toBe('強い正相関');
    });

    it('弱い正相関', () => {
      expect(MathHelper.getCorrelationLabel(0.4)).toBe('弱い正相関');
    });

    it('相関なし', () => {
      expect(MathHelper.getCorrelationLabel(0.1)).toBe('相関なし');
    });

    it('強い負相関', () => {
      expect(MathHelper.getCorrelationLabel(-0.8)).toBe('強い負相関');
    });

    it('弱い負相関', () => {
      expect(MathHelper.getCorrelationLabel(-0.4)).toBe('弱い負相関');
    });
  });
});
