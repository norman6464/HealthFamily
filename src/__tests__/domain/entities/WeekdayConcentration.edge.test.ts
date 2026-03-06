import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getWeekdayConcentration - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(DateRangeHelper.getWeekdayConcentration([])).toBe(0);
  });

  it('1件は100を返す', () => {
    expect(DateRangeHelper.getWeekdayConcentration([0])).toBe(100);
  });

  it('全て同じ曜日は100', () => {
    expect(DateRangeHelper.getWeekdayConcentration([3, 3, 3, 3, 3])).toBe(100);
  });

  it('完全均等分布(各曜日1回ずつ)は最低スコア', () => {
    const result = DateRangeHelper.getWeekdayConcentration([0, 1, 2, 3, 4, 5, 6]);
    expect(result).toBe(0);
  });

  it('完全均等分布(各曜日N回ずつ)は最低スコア', () => {
    const days = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6];
    expect(DateRangeHelper.getWeekdayConcentration(days)).toBe(0);
  });

  it('2曜日のみは中程度', () => {
    const result = DateRangeHelper.getWeekdayConcentration([1, 4, 1, 4, 1, 4]);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(80);
  });

  it('大量データで1曜日集中は高スコア', () => {
    const days = [...Array(90).fill(1), ...Array(10).fill(2)];
    const result = DateRangeHelper.getWeekdayConcentration(days);
    expect(result).toBeGreaterThan(85);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = DateRangeHelper.getWeekdayConcentration([0, 0, 0]);
    const result2 = DateRangeHelper.getWeekdayConcentration([0, 1, 2, 3, 4, 5, 6]);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
  });

  it('無効な曜日インデックスは集中度を下げる', () => {
    // 無効値はどの曜日にもカウントされないが全体数には含まれる
    const withInvalid = DateRangeHelper.getWeekdayConcentration([0, 7, -1, 0]);
    const withoutInvalid = DateRangeHelper.getWeekdayConcentration([0, 0]);
    expect(withInvalid).toBeLessThan(withoutInvalid);
  });

  it('平日のみ(月-金)は中程度の集中', () => {
    const result = DateRangeHelper.getWeekdayConcentration([1, 2, 3, 4, 5]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });
});

describe('DateRangeHelper.getWeekdayConcentrationLabel - 境界値', () => {
  it('スコア70は集中(境界値)', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(70)).toBe('集中');
  });

  it('スコア69はやや偏り', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(69)).toBe('やや偏り');
  });

  it('スコア40はやや偏り(境界値)', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(40)).toBe('やや偏り');
  });

  it('スコア39は分散', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(39)).toBe('分散');
  });

  it('スコア0は分散', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(0)).toBe('分散');
  });

  it('スコア100は集中', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(100)).toBe('集中');
  });
});
