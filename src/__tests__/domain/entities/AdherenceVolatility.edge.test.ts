import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceVolatility エッジケーステスト', () => {
  describe('getAdherenceVolatility', () => {
    it('空配列の場合0を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatility([])).toBe(0);
    });

    it('1要素の場合0を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatility([50])).toBe(0);
    });

    it('2要素で同値の場合0を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatility([80, 80])).toBe(0);
    });

    it('2要素で差50の場合100を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatility([0, 50])).toBe(100);
    });

    it('2要素で差100の場合100を返す（上限）', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatility([0, 100])).toBe(100);
    });

    it('大量の同値データで0を返す', () => {
      const rates = Array(100).fill(75);
      expect(AdherenceTrendEntity.getAdherenceVolatility(rates)).toBe(0);
    });

    it('交互の値で高スコアを返す', () => {
      const score = AdherenceTrendEntity.getAdherenceVolatility([0, 100, 0, 100]);
      expect(score).toBe(100);
    });

    it('微小なばらつきで低スコアを返す', () => {
      const score = AdherenceTrendEntity.getAdherenceVolatility([80, 81, 80, 81]);
      expect(score).toBeLessThan(10);
    });

    it('負の値を含む場合も計算する', () => {
      const score = AdherenceTrendEntity.getAdherenceVolatility([-10, 10]);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAdherenceVolatilityLabel', () => {
    it('境界値: 30は安定を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(30)).toBe('安定');
    });

    it('境界値: 31はやや不安定を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(31)).toBe('やや不安定');
    });

    it('境界値: 60はやや不安定を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(60)).toBe('やや不安定');
    });

    it('境界値: 61は不安定を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(61)).toBe('不安定');
    });

    it('0は安定を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(0)).toBe('安定');
    });

    it('100は不安定を返す', () => {
      expect(AdherenceTrendEntity.getAdherenceVolatilityLabel(100)).toBe('不安定');
    });
  });
});
