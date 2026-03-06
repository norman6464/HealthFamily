import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getExponentialMovingAverage - エッジケース', () => {
  it('空配列は空配列を返す', () => {
    expect(MathHelper.getExponentialMovingAverage([], 3)).toEqual([]);
  });

  it('1要素はそのまま返す', () => {
    expect(MathHelper.getExponentialMovingAverage([50], 3)).toEqual([50]);
  });

  it('期間1は元の値に近い', () => {
    const result = MathHelper.getExponentialMovingAverage([10, 20, 30], 1);
    expect(result[0]).toBe(10);
    expect(result[2]).toBe(30);
  });

  it('期間が配列長より大きくても計算可能', () => {
    const result = MathHelper.getExponentialMovingAverage([10, 20, 30], 100);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(10);
  });

  it('全て同じ値はEMAも同じ', () => {
    const result = MathHelper.getExponentialMovingAverage([50, 50, 50, 50], 3);
    for (const v of result) {
      expect(v).toBe(50);
    }
  });

  it('全て0は0のまま', () => {
    const result = MathHelper.getExponentialMovingAverage([0, 0, 0], 3);
    expect(result).toEqual([0, 0, 0]);
  });

  it('負の値も処理できる', () => {
    const result = MathHelper.getExponentialMovingAverage([-10, -20, -30], 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(-10);
  });

  it('大きな値も正常に処理', () => {
    const result = MathHelper.getExponentialMovingAverage([1000000, 2000000], 3);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(1000000);
  });

  it('小数値も正しく処理', () => {
    const result = MathHelper.getExponentialMovingAverage([0.1, 0.2, 0.3], 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(0.1);
  });

  it('急上昇でEMAは遅れて追従', () => {
    const result = MathHelper.getExponentialMovingAverage([10, 10, 10, 100], 3);
    expect(result[3]).toBeLessThan(100);
    expect(result[3]).toBeGreaterThan(10);
  });

  it('急下降でEMAは遅れて追従', () => {
    const result = MathHelper.getExponentialMovingAverage([100, 100, 100, 10], 3);
    expect(result[3]).toBeGreaterThan(10);
    expect(result[3]).toBeLessThan(100);
  });

  it('結果の長さは入力と同じ', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = MathHelper.getExponentialMovingAverage(input, 5);
    expect(result).toHaveLength(input.length);
  });

  it('2要素でも計算可能', () => {
    const result = MathHelper.getExponentialMovingAverage([10, 20], 3);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(10);
    expect(result[1]).toBeGreaterThan(10);
    expect(result[1]).toBeLessThanOrEqual(20);
  });

  it('期間0でも計算可能', () => {
    const result = MathHelper.getExponentialMovingAverage([10, 20, 30], 0);
    expect(result).toHaveLength(3);
  });
});

describe('MathHelper.getEMALabel - エッジケース', () => {
  it('現在値がEMAより大きいと上昇基調', () => {
    expect(MathHelper.getEMALabel(60, 50)).toBe('上昇基調');
  });

  it('現在値がEMAより小さいと下降基調', () => {
    expect(MathHelper.getEMALabel(40, 50)).toBe('下降基調');
  });

  it('現在値とEMAが同じなら横ばい', () => {
    expect(MathHelper.getEMALabel(50, 50)).toBe('横ばい');
  });

  it('0同士は横ばい', () => {
    expect(MathHelper.getEMALabel(0, 0)).toBe('横ばい');
  });

  it('負の値でも判定可能', () => {
    expect(MathHelper.getEMALabel(-10, -20)).toBe('上昇基調');
  });
});
