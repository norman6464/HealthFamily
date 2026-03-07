import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMeanAbsolutePercentageError', () => {
  it('空配列は0', () => {
    expect(MathHelper.getMeanAbsolutePercentageError([], [])).toBe(0);
  });

  it('配列長不一致は0', () => {
    expect(MathHelper.getMeanAbsolutePercentageError([1, 2], [1])).toBe(0);
  });

  it('同値は0', () => {
    expect(MathHelper.getMeanAbsolutePercentageError([10, 20, 30], [10, 20, 30])).toBe(0);
  });

  it('実測値に0を含む場合はスキップ', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([0, 10], [5, 10]);
    expect(result).toBe(0);
  });

  it('差が大きいほど値が大きい', () => {
    const small = MathHelper.getMeanAbsolutePercentageError([100, 100], [90, 110]);
    const large = MathHelper.getMeanAbsolutePercentageError([100, 100], [50, 150]);
    expect(large).toBeGreaterThan(small);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([10, 20], [12, 18]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('予測が全て2倍なら100', () => {
    expect(MathHelper.getMeanAbsolutePercentageError([10, 20], [20, 40])).toBe(100);
  });

  it('結果は数値', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([5, 10, 15], [6, 11, 14]);
    expect(typeof result).toBe('number');
  });

  it('1件でも計算可能', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([50], [60]);
    expect(result).toBe(20);
  });
});

describe('MathHelper.getMeanAbsolutePercentageErrorLabel', () => {
  it('低い値は精度高', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(5)).toBe('精度高');
  });

  it('中程度はやや誤差', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(15)).toBe('やや誤差');
  });

  it('高い値は誤差大', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(35)).toBe('誤差大');
  });
});
