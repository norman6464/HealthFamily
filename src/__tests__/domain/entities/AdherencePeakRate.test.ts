import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherencePeakRate', () => {
  it('空配列は0を返す', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([])).toBe(0);
  });

  it('1件はその値を返す', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([80])).toBe(80);
  });

  it('最大値を返す', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([50, 70, 90, 60])).toBe(90);
  });

  it('全て同じ値ならその値', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([75, 75, 75])).toBe(75);
  });

  it('100を含む場合は100', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([80, 100, 90])).toBe(100);
  });

  it('全て0は0', () => {
    expect(AdherenceTrendEntity.getAdherencePeakRate([0, 0, 0])).toBe(0);
  });
});

describe('AdherenceTrendEntity.getAdherencePeakLabel', () => {
  it('ピーク率90以上は優秀', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(90)).toBe('優秀');
  });

  it('ピーク率70以上は良好', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(70)).toBe('良好');
  });

  it('ピーク率50以上は普通', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(50)).toBe('普通');
  });

  it('ピーク率50未満は低調', () => {
    expect(AdherenceTrendEntity.getAdherencePeakLabel(30)).toBe('低調');
  });
});
