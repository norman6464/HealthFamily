import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper 統計関数 エッジケース', () => {
  describe('calculateAverage', () => {
    it('負数を含む配列の平均を正しく算出する', () => {
      expect(MathHelper.calculateAverage([-10, 10])).toBe(0);
    });

    it('非常に大きな値の平均を算出する', () => {
      expect(MathHelper.calculateAverage([1000000, 2000000])).toBe(1500000);
    });

    it('小数点以下0桁で丸める', () => {
      expect(MathHelper.calculateAverage([1, 2, 4], 0)).toBe(2);
    });

    it('小数が続く場合に指定桁数で丸まる', () => {
      expect(MathHelper.calculateAverage([1, 3], 2)).toBe(2);
      expect(MathHelper.calculateAverage([1, 2, 3, 5], 2)).toBe(2.75);
    });
  });

  describe('calculateMedian', () => {
    it('2要素の中央値は平均を返す', () => {
      expect(MathHelper.calculateMedian([1, 9])).toBe(5);
    });

    it('負数を含む配列の中央値を正しく算出する', () => {
      expect(MathHelper.calculateMedian([-5, 0, 5])).toBe(0);
    });

    it('重複値が多い配列でも正しく算出する', () => {
      expect(MathHelper.calculateMedian([1, 1, 1, 1, 100])).toBe(1);
    });
  });

  describe('clamp', () => {
    it('負の範囲で正しく制約する', () => {
      expect(MathHelper.clamp(-50, -100, -10)).toBe(-50);
      expect(MathHelper.clamp(-200, -100, -10)).toBe(-100);
      expect(MathHelper.clamp(0, -100, -10)).toBe(-10);
    });

    it('minとmaxが同一の場合はその値を返す', () => {
      expect(MathHelper.clamp(999, 5, 5)).toBe(5);
    });
  });
});
