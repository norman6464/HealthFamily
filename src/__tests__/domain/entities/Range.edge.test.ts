import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRange - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getRange([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getRange([42])).toBe(0);
  });

  it('2件の同値は0', () => {
    expect(MathHelper.getRange([7, 7])).toBe(0);
  });

  it('全て同じ値は0', () => {
    expect(MathHelper.getRange([5, 5, 5, 5, 5])).toBe(0);
  });

  it('2件の異なる値', () => {
    expect(MathHelper.getRange([3, 8])).toBe(5);
  });

  it('負の値のみ', () => {
    expect(MathHelper.getRange([-10, -3])).toBe(7);
  });

  it('0を含む', () => {
    expect(MathHelper.getRange([-5, 0, 5])).toBe(10);
  });

  it('大きな値', () => {
    expect(MathHelper.getRange([0, 1000000])).toBe(1000000);
  });

  it('小数値', () => {
    expect(MathHelper.getRange([0.1, 0.9])).toBeCloseTo(0.8, 5);
  });

  it('順序に依存しない', () => {
    const a = MathHelper.getRange([5, 1, 3]);
    const b = MathHelper.getRange([1, 3, 5]);
    expect(a).toBe(b);
  });

  it('結果は常に0以上', () => {
    const result = MathHelper.getRange([-100, 100]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('大量データ', () => {
    const data = Array(100).fill(50);
    data[0] = 0;
    data[99] = 100;
    expect(MathHelper.getRange(data)).toBe(100);
  });
});

describe('MathHelper.getRangeLabel - エッジケース', () => {
  it('0は狭い', () => {
    expect(MathHelper.getRangeLabel(0)).toBe('狭い');
  });

  it('9は狭い', () => {
    expect(MathHelper.getRangeLabel(9)).toBe('狭い');
  });

  it('10はやや広い', () => {
    expect(MathHelper.getRangeLabel(10)).toBe('やや広い');
  });

  it('24はやや広い', () => {
    expect(MathHelper.getRangeLabel(24)).toBe('やや広い');
  });

  it('25は広い', () => {
    expect(MathHelper.getRangeLabel(25)).toBe('広い');
  });

  it('100は広い', () => {
    expect(MathHelper.getRangeLabel(100)).toBe('広い');
  });
});
