import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceStreakBonus - エッジケース', () => {
  it('0日は0', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonus(0)).toBe(0);
  });

  it('負の値は0', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonus(-10)).toBe(0);
  });

  it('1日', () => {
    const result = AdherenceTrendEntity.getAdherenceStreakBonus(1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });

  it('15日は50', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonus(15)).toBe(50);
  });

  it('30日は100', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonus(30)).toBe(100);
  });

  it('超過しても100', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonus(60)).toBe(100);
  });

  it('日数が多いほどボーナスが高い', () => {
    const low = AdherenceTrendEntity.getAdherenceStreakBonus(5);
    const high = AdherenceTrendEntity.getAdherenceStreakBonus(25);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceTrendEntity.getAdherenceStreakBonus(10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('7日', () => {
    const result = AdherenceTrendEntity.getAdherenceStreakBonus(7);
    expect(result).toBe(23);
  });
});

describe('AdherenceTrendEntity.getAdherenceStreakBonusLabel - エッジケース', () => {
  it('100はボーナス大', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(100)).toBe('ボーナス大');
  });

  it('70はボーナス大', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(70)).toBe('ボーナス大');
  });

  it('69はボーナス中', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(69)).toBe('ボーナス中');
  });

  it('30はボーナス中', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(30)).toBe('ボーナス中');
  });

  it('29はボーナス小', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(29)).toBe('ボーナス小');
  });

  it('0はボーナス小', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(0)).toBe('ボーナス小');
  });
});
