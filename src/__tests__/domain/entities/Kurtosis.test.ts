import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getKurtosis', () => {
  it('空配列は0', () => {
    expect(MathHelper.getKurtosis([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getKurtosis([50])).toBe(0);
  });

  it('全て同値は0', () => {
    expect(MathHelper.getKurtosis([50, 50, 50, 50])).toBe(0);
  });

  it('正規分布に近いデータは0に近い', () => {
    const result = MathHelper.getKurtosis([2, 4, 6, 8, 10, 8, 6, 4, 2]);
    expect(Math.abs(result)).toBeLessThan(3);
  });

  it('尖った分布は正', () => {
    const result = MathHelper.getKurtosis([0, 0, 0, 100, 0, 0, 0]);
    expect(result).toBeGreaterThan(0);
  });

  it('均等な分布は負に近い', () => {
    const result = MathHelper.getKurtosis([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result).toBeLessThan(1);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const result = MathHelper.getKurtosis(data);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });
});

describe('MathHelper.getKurtosisLabel', () => {
  it('正の尖度は尖った分布', () => {
    expect(MathHelper.getKurtosisLabel(2)).toBe('尖った分布');
  });

  it('負の尖度は平坦な分布', () => {
    expect(MathHelper.getKurtosisLabel(-2)).toBe('平坦な分布');
  });

  it('0付近は正規分布', () => {
    expect(MathHelper.getKurtosisLabel(0)).toBe('正規分布');
  });
});
