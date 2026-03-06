import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getSkewness', () => {
  it('空配列は0', () => {
    expect(MathHelper.getSkewness([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getSkewness([50])).toBe(0);
  });

  it('2件は0', () => {
    expect(MathHelper.getSkewness([30, 70])).toBe(0);
  });

  it('対称分布は0に近い', () => {
    const result = MathHelper.getSkewness([10, 20, 30, 40, 50]);
    expect(Math.abs(result)).toBeLessThan(0.5);
  });

  it('右に偏った分布は正', () => {
    const result = MathHelper.getSkewness([1, 1, 1, 1, 100]);
    expect(result).toBeGreaterThan(0);
  });

  it('左に偏った分布は負', () => {
    const result = MathHelper.getSkewness([100, 99, 99, 99, 1]);
    expect(result).toBeLessThan(0);
  });

  it('全て同値は0', () => {
    expect(MathHelper.getSkewness([50, 50, 50, 50])).toBe(0);
  });
});

describe('MathHelper.getSkewnessLabel', () => {
  it('正の歪度は右偏り', () => {
    expect(MathHelper.getSkewnessLabel(1.5)).toBe('右偏り');
  });

  it('負の歪度は左偏り', () => {
    expect(MathHelper.getSkewnessLabel(-1.5)).toBe('左偏り');
  });

  it('0付近は対称', () => {
    expect(MathHelper.getSkewnessLabel(0)).toBe('対称');
  });
});
