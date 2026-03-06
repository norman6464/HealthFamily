import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMovingStdDev', () => {
  it('空配列は空配列を返す', () => {
    expect(MathHelper.getMovingStdDev([], 3)).toEqual([]);
  });

  it('ウィンドウより短い配列は空配列', () => {
    expect(MathHelper.getMovingStdDev([1, 2], 3)).toEqual([]);
  });

  it('全て同じ値は全て0', () => {
    const result = MathHelper.getMovingStdDev([50, 50, 50, 50], 3);
    for (const v of result) {
      expect(v).toBe(0);
    }
  });

  it('ばらつきがあると正の値', () => {
    const result = MathHelper.getMovingStdDev([10, 20, 30], 3);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeGreaterThan(0);
  });

  it('結果の長さはvalues.length - window + 1', () => {
    const result = MathHelper.getMovingStdDev([1, 2, 3, 4, 5], 3);
    expect(result).toHaveLength(3);
  });

  it('ウィンドウ1は全て0', () => {
    const result = MathHelper.getMovingStdDev([10, 20, 30], 1);
    for (const v of result) {
      expect(v).toBe(0);
    }
  });

  it('大きなばらつきは大きな値', () => {
    const result = MathHelper.getMovingStdDev([0, 100, 0], 3);
    expect(result[0]).toBeGreaterThan(0);
  });

  it('ウィンドウが配列と同じ長さ', () => {
    const result = MathHelper.getMovingStdDev([10, 20, 30], 3);
    expect(result).toHaveLength(1);
  });
});

describe('MathHelper.getMovingStdDevLabel', () => {
  it('標準偏差5未満は安定', () => {
    expect(MathHelper.getMovingStdDevLabel(3)).toBe('安定');
  });

  it('標準偏差15未満はやや変動', () => {
    expect(MathHelper.getMovingStdDevLabel(10)).toBe('やや変動');
  });

  it('標準偏差15以上は大きな変動', () => {
    expect(MathHelper.getMovingStdDevLabel(20)).toBe('大きな変動');
  });
});
