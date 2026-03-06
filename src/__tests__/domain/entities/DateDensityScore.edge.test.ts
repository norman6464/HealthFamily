import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateDensityScore - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(DateRangeHelper.getDateDensityScore([])).toBe(0);
  });

  it('1件のみは100を返す', () => {
    expect(DateRangeHelper.getDateDensityScore(['2024-01-01'])).toBe(100);
  });

  it('同一日付の重複は100を返す', () => {
    expect(DateRangeHelper.getDateDensityScore(['2024-01-01', '2024-01-01', '2024-01-01'])).toBe(100);
  });

  it('連続2日間は100を返す', () => {
    expect(DateRangeHelper.getDateDensityScore(['2024-01-01', '2024-01-02'])).toBe(100);
  });

  it('連続7日間は100を返す', () => {
    const keys = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i);
      return DateRangeHelper.toDateKey(d);
    });
    expect(DateRangeHelper.getDateDensityScore(keys)).toBe(100);
  });

  it('1日おきの3日間(5日スパン中3日)は60を返す', () => {
    const keys = ['2024-01-01', '2024-01-03', '2024-01-05'];
    expect(DateRangeHelper.getDateDensityScore(keys)).toBe(60);
  });

  it('30日間に2日のみは低密度', () => {
    const keys = ['2024-01-01', '2024-01-30'];
    const score = DateRangeHelper.getDateDensityScore(keys);
    expect(score).toBeLessThan(10);
  });

  it('365日間に10日のみは非常に低密度', () => {
    const keys = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i * 36);
      return DateRangeHelper.toDateKey(d);
    });
    const score = DateRangeHelper.getDateDensityScore(keys);
    expect(score).toBeLessThan(10);
  });

  it('ソートされていない日付でも正しく計算する', () => {
    const keys = ['2024-01-05', '2024-01-01', '2024-01-03'];
    expect(DateRangeHelper.getDateDensityScore(keys)).toBe(60);
  });

  it('重複を含む場合ユニーク数で計算する', () => {
    const keys = ['2024-01-01', '2024-01-01', '2024-01-03'];
    // unique: 2 days, span: 3 days -> 67
    expect(DateRangeHelper.getDateDensityScore(keys)).toBe(67);
  });

  it('100を超えない', () => {
    const keys = ['2024-01-01', '2024-01-01', '2024-01-01', '2024-01-01'];
    expect(DateRangeHelper.getDateDensityScore(keys)).toBeLessThanOrEqual(100);
  });
});

describe('DateRangeHelper.getDateDensityLabel - 境界値', () => {
  it('スコア100は高密度', () => {
    expect(DateRangeHelper.getDateDensityLabel(100)).toBe('高密度');
  });

  it('スコア80は高密度(境界値)', () => {
    expect(DateRangeHelper.getDateDensityLabel(80)).toBe('高密度');
  });

  it('スコア79は中密度', () => {
    expect(DateRangeHelper.getDateDensityLabel(79)).toBe('中密度');
  });

  it('スコア50は中密度(境界値)', () => {
    expect(DateRangeHelper.getDateDensityLabel(50)).toBe('中密度');
  });

  it('スコア49は低密度', () => {
    expect(DateRangeHelper.getDateDensityLabel(49)).toBe('低密度');
  });

  it('スコア0は低密度', () => {
    expect(DateRangeHelper.getDateDensityLabel(0)).toBe('低密度');
  });
});
