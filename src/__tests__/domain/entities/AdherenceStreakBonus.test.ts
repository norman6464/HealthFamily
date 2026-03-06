import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceStreakBonus', () => {
  it('0日は0', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonus(0)).toBe(0);
  });

  it('1日は低いスコア', () => {
    const result = AdherenceTrendEntity.getAdherenceStreakBonus(1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(20);
  });

  it('7日は中程度', () => {
    const result = AdherenceTrendEntity.getAdherenceStreakBonus(7);
    expect(result).toBeGreaterThan(10);
    expect(result).toBeLessThan(50);
  });

  it('30日は高い', () => {
    const result = AdherenceTrendEntity.getAdherenceStreakBonus(30);
    expect(result).toBeGreaterThan(50);
  });

  it('日数が多いほどボーナスが高い', () => {
    const low = AdherenceTrendEntity.getAdherenceStreakBonus(3);
    const high = AdherenceTrendEntity.getAdherenceStreakBonus(20);
    expect(high).toBeGreaterThan(low);
  });

  it('最大100', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonus(100)).toBeLessThanOrEqual(100);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceTrendEntity.getAdherenceStreakBonus(14);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('負の値は0', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonus(-5)).toBe(0);
  });
});

describe('AdherenceTrendEntity.getAdherenceStreakBonusLabel', () => {
  it('ボーナス高はボーナス大', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(80)).toBe('ボーナス大');
  });

  it('ボーナス中はボーナス中', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(50)).toBe('ボーナス中');
  });

  it('ボーナス低はボーナス小', () => {
    expect(AdherenceTrendEntity.getAdherenceStreakBonusLabel(15)).toBe('ボーナス小');
  });
});
