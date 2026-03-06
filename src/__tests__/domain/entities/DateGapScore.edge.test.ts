import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateGapScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(DateRangeHelper.getDateGapScore([])).toBe(0);
  });

  it('1件は0', () => {
    expect(DateRangeHelper.getDateGapScore([7])).toBe(0);
  });

  it('2件の同じ間隔は100', () => {
    expect(DateRangeHelper.getDateGapScore([7, 7])).toBe(100);
  });

  it('全て同じ間隔は100', () => {
    expect(DateRangeHelper.getDateGapScore([30, 30, 30, 30])).toBe(100);
  });

  it('全て0は100', () => {
    expect(DateRangeHelper.getDateGapScore([0, 0, 0])).toBe(100);
  });

  it('大きなばらつきは低スコア', () => {
    const result = DateRangeHelper.getDateGapScore([1, 100, 1, 100]);
    expect(result).toBeLessThan(50);
  });

  it('小さなばらつきは高スコア', () => {
    const result = DateRangeHelper.getDateGapScore([29, 30, 31, 30]);
    expect(result).toBeGreaterThan(90);
  });

  it('0-100の範囲内', () => {
    const result = DateRangeHelper.getDateGapScore([1, 50, 3, 80]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('規則的な方がスコアが高い', () => {
    const regular = DateRangeHelper.getDateGapScore([7, 7, 7, 7]);
    const irregular = DateRangeHelper.getDateGapScore([1, 14, 2, 28]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('大量データでも正常に処理', () => {
    const data = Array.from({ length: 100 }, () => 7);
    expect(DateRangeHelper.getDateGapScore(data)).toBe(100);
  });

  it('2件の異なる間隔', () => {
    const result = DateRangeHelper.getDateGapScore([10, 20]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });
});

describe('DateRangeHelper.getDateGapScoreLabel - 境界値', () => {
  it('スコア80は規則的(境界値)', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(80)).toBe('規則的');
  });

  it('スコア79はやや不規則', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(79)).toBe('やや不規則');
  });

  it('スコア50はやや不規則(境界値)', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(50)).toBe('やや不規則');
  });

  it('スコア49は不規則', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(49)).toBe('不規則');
  });

  it('スコア0は不規則', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(0)).toBe('不規則');
  });

  it('スコア100は規則的', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(100)).toBe('規則的');
  });
});
