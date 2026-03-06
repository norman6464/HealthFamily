import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('getAdherenceVolatility', () => {
  it('空配列の場合0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceVolatility([])).toBe(0);
  });

  it('1要素の場合0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceVolatility([80])).toBe(0);
  });

  it('全て同値の場合0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceVolatility([80, 80, 80])).toBe(0);
  });

  it('大きなばらつきの場合高スコアを返す', () => {
    const score = AdherenceTrendEntity.getAdherenceVolatility([0, 100, 0, 100]);
    expect(score).toBeGreaterThan(50);
  });

  it('小さなばらつきの場合低スコアを返す', () => {
    const score = AdherenceTrendEntity.getAdherenceVolatility([80, 82, 79, 81]);
    expect(score).toBeLessThan(30);
  });

  it('0-100の範囲に収まる', () => {
    const score = AdherenceTrendEntity.getAdherenceVolatility([0, 100]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getAdherenceVolatilityLabel', () => {
  it('30以下は安定を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(20)).toBe('安定');
  });

  it('60以下はやや不安定を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(50)).toBe('やや不安定');
  });

  it('60超は不安定を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(80)).toBe('不安定');
  });

  it('0は安定を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(0)).toBe('安定');
  });

  it('100は不安定を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(100)).toBe('不安定');
  });
});
