import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('WeekOverWeekChange エッジケーステスト', () => {
  describe('getWeekOverWeekChange', () => {
    it('空配列の場合0を返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([])).toBe(0);
    });

    it('1要素の場合0を返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([50])).toBe(0);
    });

    it('2要素で同値の場合0を返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([80, 80])).toBe(0);
    });

    it('大量要素でも末尾2つのみ使用する', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([10, 20, 30, 40, 50, 60])).toBe(10);
    });

    it('負の値を含む場合も正しく計算する', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([-10, -20])).toBe(-10);
    });

    it('0から100への変化を計算する', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([0, 100])).toBe(100);
    });

    it('100から0への変化を計算する', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([100, 0])).toBe(-100);
    });

    it('小数値を含む場合も正しく計算する', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekChange([50.5, 55.3])).toBeCloseTo(4.8);
    });
  });

  describe('getWeekOverWeekLabel', () => {
    it('境界値: 5は改善を返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(5)).toBe('改善');
    });

    it('境界値: 4.99は横ばいを返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(4.99)).toBe('横ばい');
    });

    it('境界値: -5は悪化を返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(-5)).toBe('悪化');
    });

    it('境界値: -4.99は横ばいを返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(-4.99)).toBe('横ばい');
    });

    it('0は横ばいを返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(0)).toBe('横ばい');
    });

    it('大きな正の値は改善を返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(100)).toBe('改善');
    });

    it('大きな負の値は悪化を返す', () => {
      expect(AdherenceTrendEntity.getWeekOverWeekLabel(-100)).toBe('悪化');
    });
  });
});
