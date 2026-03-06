import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper 統計関数', () => {
  describe('calculateAverage', () => {
    it('空配列は0を返す', () => {
      expect(MathHelper.calculateAverage([])).toBe(0);
    });

    it('単一要素はその値を返す', () => {
      expect(MathHelper.calculateAverage([5])).toBe(5);
    });

    it('複数要素の平均を算出する', () => {
      expect(MathHelper.calculateAverage([10, 20, 30])).toBe(20);
    });

    it('小数点以下を指定桁数で丸める', () => {
      expect(MathHelper.calculateAverage([1, 2, 3], 2)).toBe(2);
      expect(MathHelper.calculateAverage([1, 2], 2)).toBe(1.5);
    });

    it('デフォルトは小数点以下1桁', () => {
      expect(MathHelper.calculateAverage([1, 2, 4])).toBe(2.3);
    });

    it('全て0の場合は0を返す', () => {
      expect(MathHelper.calculateAverage([0, 0, 0])).toBe(0);
    });
  });

  describe('calculateMedian', () => {
    it('空配列は0を返す', () => {
      expect(MathHelper.calculateMedian([])).toBe(0);
    });

    it('単一要素はその値を返す', () => {
      expect(MathHelper.calculateMedian([7])).toBe(7);
    });

    it('奇数個の中央値を返す', () => {
      expect(MathHelper.calculateMedian([3, 1, 2])).toBe(2);
    });

    it('偶数個の中央2値の平均を返す', () => {
      expect(MathHelper.calculateMedian([1, 2, 3, 4])).toBe(2.5);
    });

    it('ソートされていない配列でも正しく算出する', () => {
      expect(MathHelper.calculateMedian([5, 1, 3, 2, 4])).toBe(3);
    });

    it('同一値の配列はその値を返す', () => {
      expect(MathHelper.calculateMedian([3, 3, 3])).toBe(3);
    });
  });

  describe('clamp', () => {
    it('範囲内の値はそのまま返す', () => {
      expect(MathHelper.clamp(5, 0, 10)).toBe(5);
    });

    it('最小値未満は最小値を返す', () => {
      expect(MathHelper.clamp(-5, 0, 10)).toBe(0);
    });

    it('最大値超過は最大値を返す', () => {
      expect(MathHelper.clamp(15, 0, 10)).toBe(10);
    });

    it('境界値はそのまま返す', () => {
      expect(MathHelper.clamp(0, 0, 10)).toBe(0);
      expect(MathHelper.clamp(10, 0, 10)).toBe(10);
    });
  });
});
