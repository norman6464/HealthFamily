import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Normalize Range Edge Cases', () => {
  describe('normalizeToRange', () => {
    it('min > maxは100', () => {
      expect(MathHelper.normalizeToRange(50, 100, 0)).toBe(100);
    });

    it('負の範囲', () => {
      expect(MathHelper.normalizeToRange(0, -100, 100)).toBe(50);
    });

    it('小数値', () => {
      expect(MathHelper.normalizeToRange(0.5, 0, 1)).toBe(50);
    });

    it('非常に大きな範囲', () => {
      expect(MathHelper.normalizeToRange(500000, 0, 1000000)).toBe(50);
    });
  });

  describe('getNormalizedRangeLabel', () => {
    it('境界値80は高い', () => {
      expect(MathHelper.getNormalizedRangeLabel(80)).toBe('高い');
    });

    it('境界値79は中程度', () => {
      expect(MathHelper.getNormalizedRangeLabel(79)).toBe('中程度');
    });

    it('境界値50は中程度', () => {
      expect(MathHelper.getNormalizedRangeLabel(50)).toBe('中程度');
    });

    it('境界値49は低い', () => {
      expect(MathHelper.getNormalizedRangeLabel(49)).toBe('低い');
    });

    it('境界値20は低い', () => {
      expect(MathHelper.getNormalizedRangeLabel(20)).toBe('低い');
    });

    it('境界値19は非常に低い', () => {
      expect(MathHelper.getNormalizedRangeLabel(19)).toBe('非常に低い');
    });
  });
});
