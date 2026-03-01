import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity, AdherenceTrend } from '@/domain/entities/AdherenceTrend';

const createTrend = (overrides: Partial<AdherenceTrend> = {}): AdherenceTrend => ({
  dayOfWeekStats: [],
  bestDay: '月',
  worstDay: '日',
  previousPeriodRate: 70,
  currentPeriodRate: 80,
  rateChange: 10,
  ...overrides,
});

describe('AdherenceTrendEntity', () => {
  it('改善中の場合isImprovingがtrueを返す', () => {
    const entity = new AdherenceTrendEntity(createTrend({ rateChange: 5 }));
    expect(entity.isImproving()).toBe(true);
    expect(entity.isDeclining()).toBe(false);
  });

  it('低下中の場合isImprovingがfalseを返す', () => {
    const entity = new AdherenceTrendEntity(createTrend({ rateChange: -3 }));
    expect(entity.isImproving()).toBe(false);
    expect(entity.isDeclining()).toBe(true);
  });

  it('変化なしの場合両方falseを返す', () => {
    const entity = new AdherenceTrendEntity(createTrend({ rateChange: 0 }));
    expect(entity.isImproving()).toBe(false);
    expect(entity.isDeclining()).toBe(false);
  });

  it('増加の変化率ラベルに+が付く', () => {
    const entity = new AdherenceTrendEntity(createTrend({ rateChange: 10 }));
    expect(entity.getRateChangeLabel()).toBe('+10%');
  });

  it('減少の変化率ラベルに-が付く', () => {
    const entity = new AdherenceTrendEntity(createTrend({ rateChange: -5 }));
    expect(entity.getRateChangeLabel()).toBe('-5%');
  });

  it('変化なしの場合0%を返す', () => {
    const entity = new AdherenceTrendEntity(createTrend({ rateChange: 0 }));
    expect(entity.getRateChangeLabel()).toBe('0%');
  });

  it('getDayLabelが正しい曜日名を返す', () => {
    expect(AdherenceTrendEntity.getDayLabel(0)).toBe('日');
    expect(AdherenceTrendEntity.getDayLabel(1)).toBe('月');
    expect(AdherenceTrendEntity.getDayLabel(6)).toBe('土');
  });

  it('dataがトレンドデータを返す', () => {
    const trend = createTrend({ bestDay: '火' });
    const entity = new AdherenceTrendEntity(trend);
    expect(entity.data.bestDay).toBe('火');
  });
});
