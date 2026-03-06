import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRootMeanSquare - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getRootMeanSquare([])).toBe(0);
  });

  it('1件の0は0', () => {
    expect(MathHelper.getRootMeanSquare([0])).toBe(0);
  });

  it('1件の正値', () => {
    expect(MathHelper.getRootMeanSquare([7])).toBe(7);
  });

  it('1件の負値', () => {
    expect(MathHelper.getRootMeanSquare([-7])).toBe(7);
  });

  it('全て0は0', () => {
    expect(MathHelper.getRootMeanSquare([0, 0, 0, 0])).toBe(0);
  });

  it('全て同じ正値', () => {
    expect(MathHelper.getRootMeanSquare([4, 4, 4])).toBe(4);
  });

  it('正負対称', () => {
    // [-5, 5] -> sqrt((25+25)/2) = sqrt(25) = 5
    expect(MathHelper.getRootMeanSquare([-5, 5])).toBe(5);
  });

  it('大きな値', () => {
    const result = MathHelper.getRootMeanSquare([1000, 2000]);
    expect(result).toBeGreaterThan(0);
  });

  it('小数値', () => {
    const result = MathHelper.getRootMeanSquare([0.5, 1.5]);
    expect(result).toBeGreaterThan(0);
  });

  it('RMSは常に0以上', () => {
    const result = MathHelper.getRootMeanSquare([-10, -20, -30]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('2件で[3,4]', () => {
    // sqrt((9+16)/2) = sqrt(12.5) ≈ 3.54
    const result = MathHelper.getRootMeanSquare([3, 4]);
    expect(result).toBeCloseTo(3.54, 1);
  });

  it('大量データ', () => {
    const data = Array(100).fill(10);
    expect(MathHelper.getRootMeanSquare(data)).toBe(10);
  });

  it('RMSは平均以上(正値)', () => {
    const values = [2, 4, 6, 8];
    const rms = MathHelper.getRootMeanSquare(values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    expect(rms).toBeGreaterThanOrEqual(avg);
  });
});

describe('MathHelper.getRootMeanSquareLabel - エッジケース', () => {
  it('0は低い', () => {
    expect(MathHelper.getRootMeanSquareLabel(0)).toBe('低い');
  });

  it('29は低い', () => {
    expect(MathHelper.getRootMeanSquareLabel(29)).toBe('低い');
  });

  it('30は中程度', () => {
    expect(MathHelper.getRootMeanSquareLabel(30)).toBe('中程度');
  });

  it('69は中程度', () => {
    expect(MathHelper.getRootMeanSquareLabel(69)).toBe('中程度');
  });

  it('70は高い', () => {
    expect(MathHelper.getRootMeanSquareLabel(70)).toBe('高い');
  });

  it('100は高い', () => {
    expect(MathHelper.getRootMeanSquareLabel(100)).toBe('高い');
  });
});
