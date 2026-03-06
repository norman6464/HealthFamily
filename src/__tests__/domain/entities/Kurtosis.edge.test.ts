import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getKurtosis - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getKurtosis([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getKurtosis([50])).toBe(0);
  });

  it('2件は0', () => {
    expect(MathHelper.getKurtosis([10, 90])).toBe(0);
  });

  it('全て同値は0', () => {
    expect(MathHelper.getKurtosis([50, 50, 50, 50, 50])).toBe(0);
  });

  it('全て0は0', () => {
    expect(MathHelper.getKurtosis([0, 0, 0, 0])).toBe(0);
  });

  it('3件の最小ケース', () => {
    const result = MathHelper.getKurtosis([1, 2, 3]);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });

  it('負の値を含む', () => {
    const result = MathHelper.getKurtosis([-10, -5, 0, 5, 10]);
    expect(typeof result).toBe('number');
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 200 }, (_, i) => i);
    const result = MathHelper.getKurtosis(data);
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });

  it('極端な外れ値は正の尖度', () => {
    const data = Array.from({ length: 20 }, () => 50);
    data.push(1000);
    const result = MathHelper.getKurtosis(data);
    expect(result).toBeGreaterThan(0);
  });

  it('均等分布は負の尖度', () => {
    const result = MathHelper.getKurtosis([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result).toBeLessThan(0);
  });

  it('尖った分布は正の尖度', () => {
    const result = MathHelper.getKurtosis([0, 0, 0, 0, 100, 0, 0, 0, 0]);
    expect(result).toBeGreaterThan(0);
  });

  it('小数値', () => {
    const result = MathHelper.getKurtosis([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(typeof result).toBe('number');
  });

  it('2値分布', () => {
    const result = MathHelper.getKurtosis([0, 0, 0, 100, 100, 100]);
    expect(typeof result).toBe('number');
  });

  it('対称分布', () => {
    const result = MathHelper.getKurtosis([1, 3, 5, 7, 9, 7, 5, 3, 1]);
    expect(typeof result).toBe('number');
  });

  it('重複値が多い', () => {
    const result = MathHelper.getKurtosis([1, 1, 1, 1, 1, 1, 1, 100]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getKurtosisLabel - 境界値', () => {
  it('尖度0は正規分布', () => {
    expect(MathHelper.getKurtosisLabel(0)).toBe('正規分布');
  });

  it('尖度1は正規分布(境界値)', () => {
    expect(MathHelper.getKurtosisLabel(1)).toBe('正規分布');
  });

  it('尖度1.01は尖った分布', () => {
    expect(MathHelper.getKurtosisLabel(1.01)).toBe('尖った分布');
  });

  it('尖度-1は正規分布(境界値)', () => {
    expect(MathHelper.getKurtosisLabel(-1)).toBe('正規分布');
  });

  it('尖度-1.01は平坦な分布', () => {
    expect(MathHelper.getKurtosisLabel(-1.01)).toBe('平坦な分布');
  });

  it('尖度10は尖った分布', () => {
    expect(MathHelper.getKurtosisLabel(10)).toBe('尖った分布');
  });

  it('尖度-10は平坦な分布', () => {
    expect(MathHelper.getKurtosisLabel(-10)).toBe('平坦な分布');
  });
});
