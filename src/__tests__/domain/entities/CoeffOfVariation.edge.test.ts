import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getCoeffOfVariation - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getCoeffOfVariation([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getCoeffOfVariation([50])).toBe(0);
  });

  it('2件の同値は0', () => {
    expect(MathHelper.getCoeffOfVariation([50, 50])).toBe(0);
  });

  it('全て同値は0', () => {
    expect(MathHelper.getCoeffOfVariation([30, 30, 30, 30])).toBe(0);
  });

  it('全て0は0', () => {
    expect(MathHelper.getCoeffOfVariation([0, 0, 0])).toBe(0);
  });

  it('2件の異なる値', () => {
    const result = MathHelper.getCoeffOfVariation([10, 90]);
    expect(result).toBeGreaterThan(0);
  });

  it('結果は非負', () => {
    const result = MathHelper.getCoeffOfVariation([5, 10, 15, 20, 25]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = MathHelper.getCoeffOfVariation(data);
    expect(result).toBeGreaterThan(0);
    expect(isNaN(result)).toBe(false);
  });

  it('ばらつき大 > ばらつき小', () => {
    const small = MathHelper.getCoeffOfVariation([49, 50, 51]);
    const large = MathHelper.getCoeffOfVariation([10, 50, 90]);
    expect(large).toBeGreaterThan(small);
  });

  it('負の値を含む場合', () => {
    const result = MathHelper.getCoeffOfVariation([-10, 0, 10]);
    expect(typeof result).toBe('number');
  });

  it('小数値', () => {
    const result = MathHelper.getCoeffOfVariation([0.1, 0.2, 0.3]);
    expect(result).toBeGreaterThan(0);
  });

  it('非常に大きな値', () => {
    const result = MathHelper.getCoeffOfVariation([1000000, 2000000, 3000000]);
    expect(result).toBeGreaterThan(0);
  });

  it('同一値の長い配列は0', () => {
    const data = Array.from({ length: 50 }, () => 100);
    expect(MathHelper.getCoeffOfVariation(data)).toBe(0);
  });

  it('3件の等差数列', () => {
    const result = MathHelper.getCoeffOfVariation([10, 20, 30]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getCoeffOfVariationLabel - 境界値', () => {
  it('CV 0は安定', () => {
    expect(MathHelper.getCoeffOfVariationLabel(0)).toBe('安定');
  });

  it('CV 19は安定', () => {
    expect(MathHelper.getCoeffOfVariationLabel(19)).toBe('安定');
  });

  it('CV 20はやや変動(境界値)', () => {
    expect(MathHelper.getCoeffOfVariationLabel(20)).toBe('やや変動');
  });

  it('CV 49はやや変動', () => {
    expect(MathHelper.getCoeffOfVariationLabel(49)).toBe('やや変動');
  });

  it('CV 50は変動大(境界値)', () => {
    expect(MathHelper.getCoeffOfVariationLabel(50)).toBe('変動大');
  });

  it('CV 100は変動大', () => {
    expect(MathHelper.getCoeffOfVariationLabel(100)).toBe('変動大');
  });
});
