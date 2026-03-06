import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getSkewness - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getSkewness([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getSkewness([50])).toBe(0);
  });

  it('2件は0', () => {
    expect(MathHelper.getSkewness([10, 90])).toBe(0);
  });

  it('全て同値は0', () => {
    expect(MathHelper.getSkewness([50, 50, 50, 50, 50])).toBe(0);
  });

  it('完全対称は0に近い', () => {
    const result = MathHelper.getSkewness([10, 20, 30, 20, 10]);
    expect(Math.abs(result)).toBeLessThan(0.5);
  });

  it('右偏りは正値', () => {
    const result = MathHelper.getSkewness([1, 2, 3, 4, 100]);
    expect(result).toBeGreaterThan(0);
  });

  it('左偏りは負値', () => {
    const result = MathHelper.getSkewness([100, 96, 97, 98, 1]);
    expect(result).toBeLessThan(0);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const result = MathHelper.getSkewness(data);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });

  it('全て0は0', () => {
    expect(MathHelper.getSkewness([0, 0, 0])).toBe(0);
  });

  it('負の値を含むデータ', () => {
    const result = MathHelper.getSkewness([-10, -5, 0, 5, 10]);
    expect(typeof result).toBe('number');
  });

  it('3件の最小ケース', () => {
    const result = MathHelper.getSkewness([1, 2, 3]);
    expect(typeof result).toBe('number');
  });

  it('極端な外れ値', () => {
    const result = MathHelper.getSkewness([1, 1, 1, 1, 1000]);
    expect(result).toBeGreaterThan(0);
  });

  it('小数値', () => {
    const result = MathHelper.getSkewness([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(typeof result).toBe('number');
  });

  it('右偏りは左偏りと符号が逆', () => {
    const right = MathHelper.getSkewness([1, 1, 1, 1, 100]);
    const left = MathHelper.getSkewness([100, 99, 99, 99, 1]);
    expect(right > 0).toBe(true);
    expect(left < 0).toBe(true);
  });

  it('均等分布は0に近い', () => {
    const result = MathHelper.getSkewness([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(Math.abs(result)).toBeLessThan(0.5);
  });

  it('重複値が多い場合', () => {
    const result = MathHelper.getSkewness([5, 5, 5, 5, 100]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getSkewnessLabel - 境界値', () => {
  it('歪度0は対称', () => {
    expect(MathHelper.getSkewnessLabel(0)).toBe('対称');
  });

  it('歪度0.5は対称(境界値)', () => {
    expect(MathHelper.getSkewnessLabel(0.5)).toBe('対称');
  });

  it('歪度0.51は右偏り', () => {
    expect(MathHelper.getSkewnessLabel(0.51)).toBe('右偏り');
  });

  it('歪度-0.5は対称(境界値)', () => {
    expect(MathHelper.getSkewnessLabel(-0.5)).toBe('対称');
  });

  it('歪度-0.51は左偏り', () => {
    expect(MathHelper.getSkewnessLabel(-0.51)).toBe('左偏り');
  });

  it('歪度5は右偏り', () => {
    expect(MathHelper.getSkewnessLabel(5)).toBe('右偏り');
  });

  it('歪度-5は左偏り', () => {
    expect(MathHelper.getSkewnessLabel(-5)).toBe('左偏り');
  });
});
