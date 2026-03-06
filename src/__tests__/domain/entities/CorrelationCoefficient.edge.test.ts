import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Correlation Coefficient Edge Cases', () => {
  describe('getCorrelationCoefficient', () => {
    it('2件の正相関', () => {
      const result = MathHelper.getCorrelationCoefficient([1, 2], [3, 4]);
      expect(result).toBe(1);
    });

    it('2件の負相関', () => {
      const result = MathHelper.getCorrelationCoefficient([1, 2], [4, 3]);
      expect(result).toBe(-1);
    });

    it('片方が全て同じ値は0', () => {
      expect(MathHelper.getCorrelationCoefficient([1, 2, 3], [5, 5, 5])).toBe(0);
    });

    it('大きな値', () => {
      const result = MathHelper.getCorrelationCoefficient([1000, 2000, 3000], [100, 200, 300]);
      expect(result).toBe(1);
    });

    it('負の値を含む', () => {
      const result = MathHelper.getCorrelationCoefficient([-3, -2, -1, 0, 1], [1, 2, 3, 4, 5]);
      expect(result).toBe(1);
    });

    it('結果は-1から1の範囲', () => {
      const result = MathHelper.getCorrelationCoefficient([4, 2, 7, 1, 5], [3, 8, 1, 6, 2]);
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('小数値', () => {
      const result = MathHelper.getCorrelationCoefficient([0.1, 0.2, 0.3], [0.3, 0.6, 0.9]);
      expect(result).toBe(1);
    });
  });

  describe('getCorrelationLabel', () => {
    it('境界値0.7は強い正相関', () => {
      expect(MathHelper.getCorrelationLabel(0.7)).toBe('強い正相関');
    });

    it('境界値0.69は弱い正相関', () => {
      expect(MathHelper.getCorrelationLabel(0.69)).toBe('弱い正相関');
    });

    it('境界値0.3は弱い正相関', () => {
      expect(MathHelper.getCorrelationLabel(0.3)).toBe('弱い正相関');
    });

    it('境界値0.29は相関なし', () => {
      expect(MathHelper.getCorrelationLabel(0.29)).toBe('相関なし');
    });

    it('境界値-0.7は強い負相関', () => {
      expect(MathHelper.getCorrelationLabel(-0.7)).toBe('強い負相関');
    });

    it('境界値-0.3は弱い負相関', () => {
      expect(MathHelper.getCorrelationLabel(-0.3)).toBe('弱い負相関');
    });

    it('0は相関なし', () => {
      expect(MathHelper.getCorrelationLabel(0)).toBe('相関なし');
    });

    it('1は強い正相関', () => {
      expect(MathHelper.getCorrelationLabel(1)).toBe('強い正相関');
    });

    it('-1は強い負相関', () => {
      expect(MathHelper.getCorrelationLabel(-1)).toBe('強い負相関');
    });
  });
});
