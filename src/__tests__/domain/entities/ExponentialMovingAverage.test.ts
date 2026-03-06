import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getExponentialMovingAverage', () => {
  it('空配列は空配列を返す', () => {
    expect(MathHelper.getExponentialMovingAverage([], 3)).toEqual([]);
  });

  it('1要素はその値を返す', () => {
    expect(MathHelper.getExponentialMovingAverage([5], 3)).toEqual([5]);
  });

  it('全て同じ値ならEMAも同じ', () => {
    const result = MathHelper.getExponentialMovingAverage([10, 10, 10, 10], 3);
    result.forEach((v) => expect(v).toBe(10));
  });

  it('EMAは直近の値に重みをかける', () => {
    const values = [10, 20, 30, 40, 50];
    const ema = MathHelper.getExponentialMovingAverage(values, 3);
    // 最後のEMAは単純平均より大きい（上昇トレンドなので）
    const simpleAvg = values.reduce((a, b) => a + b, 0) / values.length;
    expect(ema[ema.length - 1]).toBeGreaterThan(simpleAvg);
  });

  it('出力配列は入力と同じ長さ', () => {
    const values = [1, 2, 3, 4, 5];
    expect(MathHelper.getExponentialMovingAverage(values, 3)).toHaveLength(5);
  });

  it('period=1は元の値と同じ', () => {
    const values = [1, 5, 3, 7, 2];
    const ema = MathHelper.getExponentialMovingAverage(values, 1);
    expect(ema).toEqual(values);
  });

  it('小数点1桁に丸められる', () => {
    const ema = MathHelper.getExponentialMovingAverage([10, 20, 30], 2);
    ema.forEach((v) => {
      const decimalPart = v.toString().split('.')[1] || '';
      expect(decimalPart.length).toBeLessThanOrEqual(1);
    });
  });
});

describe('MathHelper.getEMALabel', () => {
  it('現在値がEMAより高いなら上昇基調', () => {
    expect(MathHelper.getEMALabel(50, 40)).toBe('上昇基調');
  });

  it('現在値がEMAより低いなら下降基調', () => {
    expect(MathHelper.getEMALabel(30, 40)).toBe('下降基調');
  });

  it('現在値がEMAと同じなら横ばい', () => {
    expect(MathHelper.getEMALabel(40, 40)).toBe('横ばい');
  });
});
