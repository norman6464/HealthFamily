import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('getDateDensityScore', () => {
  it('空配列の場合0を返す', () => {
    expect(DateRangeHelper.getDateDensityScore([])).toBe(0);
  });

  it('1日のみの場合100を返す', () => {
    expect(DateRangeHelper.getDateDensityScore(['2026-01-01'])).toBe(100);
  });

  it('連続2日の場合100を返す', () => {
    expect(DateRangeHelper.getDateDensityScore(['2026-01-01', '2026-01-02'])).toBe(100);
  });

  it('2日間隔の場合50を返す', () => {
    expect(DateRangeHelper.getDateDensityScore(['2026-01-01', '2026-01-03'])).toBe(67);
  });

  it('31日間で毎日記録の場合100を返す', () => {
    const keys = Array.from({ length: 31 }, (_, i) => {
      const d = new Date(2026, 0, i + 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    expect(DateRangeHelper.getDateDensityScore(keys)).toBe(100);
  });

  it('重複日付は1回としてカウントする', () => {
    expect(DateRangeHelper.getDateDensityScore(['2026-01-01', '2026-01-01', '2026-01-03'])).toBe(67);
  });
});

describe('getDateDensityLabel', () => {
  it('80以上は高密度を返す', () => {
    expect(DateRangeHelper.getDateDensityLabel(80)).toBe('高密度');
  });

  it('50以上80未満は中密度を返す', () => {
    expect(DateRangeHelper.getDateDensityLabel(60)).toBe('中密度');
  });

  it('50未満は低密度を返す', () => {
    expect(DateRangeHelper.getDateDensityLabel(30)).toBe('低密度');
  });

  it('100は高密度を返す', () => {
    expect(DateRangeHelper.getDateDensityLabel(100)).toBe('高密度');
  });

  it('0は低密度を返す', () => {
    expect(DateRangeHelper.getDateDensityLabel(0)).toBe('低密度');
  });
});
