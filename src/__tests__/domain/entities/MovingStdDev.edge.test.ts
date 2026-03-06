import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMovingStdDev - エッジケース', () => {
  it('空配列は空配列', () => {
    expect(MathHelper.getMovingStdDev([], 3)).toEqual([]);
  });

  it('ウィンドウ0は空配列', () => {
    expect(MathHelper.getMovingStdDev([1, 2, 3], 0)).toEqual([]);
  });

  it('負のウィンドウは空配列', () => {
    expect(MathHelper.getMovingStdDev([1, 2, 3], -1)).toEqual([]);
  });

  it('ウィンドウが配列より長いと空配列', () => {
    expect(MathHelper.getMovingStdDev([1, 2], 5)).toEqual([]);
  });

  it('ウィンドウ1は全て0(1要素の標準偏差は0)', () => {
    const result = MathHelper.getMovingStdDev([10, 20, 30, 40], 1);
    expect(result).toHaveLength(4);
    for (const v of result) {
      expect(v).toBe(0);
    }
  });

  it('全て同じ値の場合全て0', () => {
    const result = MathHelper.getMovingStdDev([100, 100, 100, 100, 100], 3);
    for (const v of result) {
      expect(v).toBe(0);
    }
  });

  it('2要素ウィンドウで計算', () => {
    const result = MathHelper.getMovingStdDev([10, 20, 30], 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeGreaterThan(0);
  });

  it('大きなウィンドウ(配列と同じ長さ)', () => {
    const result = MathHelper.getMovingStdDev([10, 20, 30, 40, 50], 5);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeGreaterThan(0);
  });

  it('結果の長さはvalues.length - window + 1', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = MathHelper.getMovingStdDev(values, 4);
    expect(result).toHaveLength(7);
  });

  it('全て0の場合全て0', () => {
    const result = MathHelper.getMovingStdDev([0, 0, 0, 0], 3);
    for (const v of result) {
      expect(v).toBe(0);
    }
  });

  it('負の値も正しく処理', () => {
    const result = MathHelper.getMovingStdDev([-10, -20, -30], 3);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeGreaterThan(0);
  });

  it('大きなばらつきは大きな値', () => {
    const stable = MathHelper.getMovingStdDev([50, 51, 49], 3);
    const unstable = MathHelper.getMovingStdDev([0, 100, 0], 3);
    expect(unstable[0]).toBeGreaterThan(stable[0]);
  });

  it('結果は全て0以上', () => {
    const result = MathHelper.getMovingStdDev([5, 3, 8, 1, 9, 2, 7], 3);
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('小数値も正しく処理', () => {
    const result = MathHelper.getMovingStdDev([0.1, 0.2, 0.3], 3);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeGreaterThan(0);
  });
});

describe('MathHelper.getMovingStdDevLabel - 境界値', () => {
  it('標準偏差0は安定', () => {
    expect(MathHelper.getMovingStdDevLabel(0)).toBe('安定');
  });

  it('標準偏差4.99は安定', () => {
    expect(MathHelper.getMovingStdDevLabel(4.99)).toBe('安定');
  });

  it('標準偏差5はやや変動(境界値)', () => {
    expect(MathHelper.getMovingStdDevLabel(5)).toBe('やや変動');
  });

  it('標準偏差14.99はやや変動', () => {
    expect(MathHelper.getMovingStdDevLabel(14.99)).toBe('やや変動');
  });

  it('標準偏差15は大きな変動(境界値)', () => {
    expect(MathHelper.getMovingStdDevLabel(15)).toBe('大きな変動');
  });

  it('標準偏差100は大きな変動', () => {
    expect(MathHelper.getMovingStdDevLabel(100)).toBe('大きな変動');
  });
});
