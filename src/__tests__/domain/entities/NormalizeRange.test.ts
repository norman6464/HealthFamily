import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Normalize Range', () => {
  describe('normalizeToRange', () => {
    it('中間値は50', () => {
      expect(MathHelper.normalizeToRange(50, 0, 100)).toBe(50);
    });

    it('最小値は0', () => {
      expect(MathHelper.normalizeToRange(0, 0, 100)).toBe(0);
    });

    it('最大値は100', () => {
      expect(MathHelper.normalizeToRange(100, 0, 100)).toBe(100);
    });

    it('範囲外の値はクランプされる(下限)', () => {
      expect(MathHelper.normalizeToRange(-10, 0, 100)).toBe(0);
    });

    it('範囲外の値はクランプされる(上限)', () => {
      expect(MathHelper.normalizeToRange(150, 0, 100)).toBe(100);
    });

    it('カスタム範囲', () => {
      expect(MathHelper.normalizeToRange(75, 50, 100)).toBe(50);
    });

    it('同じmin/maxは100', () => {
      expect(MathHelper.normalizeToRange(5, 5, 5)).toBe(100);
    });
  });

  describe('getNormalizedRangeLabel', () => {
    it('80以上は高い', () => {
      expect(MathHelper.getNormalizedRangeLabel(80)).toBe('高い');
    });

    it('50以上は中程度', () => {
      expect(MathHelper.getNormalizedRangeLabel(50)).toBe('中程度');
    });

    it('20以上は低い', () => {
      expect(MathHelper.getNormalizedRangeLabel(20)).toBe('低い');
    });

    it('20未満は非常に低い', () => {
      expect(MathHelper.getNormalizedRangeLabel(19)).toBe('非常に低い');
    });
  });
});
