import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getInterquartileRange - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getInterquartileRange([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getInterquartileRange([50])).toBe(0);
  });

  it('2件の同値は0', () => {
    expect(MathHelper.getInterquartileRange([50, 50])).toBe(0);
  });

  it('2件の異なる値', () => {
    const result = MathHelper.getInterquartileRange([10, 90]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('全て同値は0', () => {
    expect(MathHelper.getInterquartileRange([30, 30, 30, 30, 30])).toBe(0);
  });

  it('ソート済みデータ', () => {
    const result = MathHelper.getInterquartileRange([1, 2, 3, 4, 5, 6, 7]);
    expect(result).toBeGreaterThan(0);
  });

  it('逆順データも正しい', () => {
    const sorted = MathHelper.getInterquartileRange([1, 2, 3, 4, 5, 6, 7]);
    const reversed = MathHelper.getInterquartileRange([7, 6, 5, 4, 3, 2, 1]);
    expect(reversed).toBe(sorted);
  });

  it('負の値を含む', () => {
    const result = MathHelper.getInterquartileRange([-10, -5, 0, 5, 10]);
    expect(result).toBeGreaterThan(0);
  });

  it('大きな散布はIQRも大きい', () => {
    const narrow = MathHelper.getInterquartileRange([49, 50, 50, 51]);
    const wide = MathHelper.getInterquartileRange([0, 25, 75, 100]);
    expect(wide).toBeGreaterThan(narrow);
  });

  it('0-100範囲のデータ', () => {
    const result = MathHelper.getInterquartileRange([0, 25, 50, 75, 100]);
    expect(result).toBe(50);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const result = MathHelper.getInterquartileRange(data);
    expect(result).toBeGreaterThan(0);
  });

  it('結果は非負', () => {
    const result = MathHelper.getInterquartileRange([5, 1, 3, 8, 2]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('3件のデータ', () => {
    const result = MathHelper.getInterquartileRange([10, 20, 30]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('4件の均等データ', () => {
    const result = MathHelper.getInterquartileRange([0, 10, 20, 30]);
    expect(result).toBeGreaterThan(0);
  });

  it('重複値が多いデータ', () => {
    const result = MathHelper.getInterquartileRange([1, 1, 1, 1, 100]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('小数値', () => {
    const result = MathHelper.getInterquartileRange([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getIQRLabel - 境界値', () => {
  it('IQR 0は安定', () => {
    expect(MathHelper.getIQRLabel(0)).toBe('安定');
  });

  it('IQR 5は安定(境界値)', () => {
    expect(MathHelper.getIQRLabel(5)).toBe('安定');
  });

  it('IQR 6はやや散布', () => {
    expect(MathHelper.getIQRLabel(6)).toBe('やや散布');
  });

  it('IQR 20はやや散布(境界値)', () => {
    expect(MathHelper.getIQRLabel(20)).toBe('やや散布');
  });

  it('IQR 21は散布', () => {
    expect(MathHelper.getIQRLabel(21)).toBe('散布');
  });

  it('IQR 100は散布', () => {
    expect(MathHelper.getIQRLabel(100)).toBe('散布');
  });
});
