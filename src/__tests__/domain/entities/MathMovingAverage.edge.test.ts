import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathMovingAverage エッジケース', () => {
  describe('calculateMovingAverage', () => {
    it('ウィンドウ1は元の配列を返す', () => {
      expect(MathHelper.calculateMovingAverage([3, 5, 7], 1)).toEqual([3, 5, 7]);
    });

    it('全て同じ値なら移動平均も同じ値', () => {
      expect(MathHelper.calculateMovingAverage([4, 4, 4, 4], 2)).toEqual([4, 4, 4]);
    });

    it('1要素の配列でウィンドウ1なら1要素を返す', () => {
      expect(MathHelper.calculateMovingAverage([10], 1)).toEqual([10]);
    });
  });

  describe('calculateChangeRate', () => {
    it('0から0は変化率0', () => {
      expect(MathHelper.calculateChangeRate(0, 0)).toBe(0);
    });

    it('大きな減少は-100に近い値', () => {
      expect(MathHelper.calculateChangeRate(1000, 1)).toBe(-100);
    });

    it('微小な変化は丸められる', () => {
      expect(MathHelper.calculateChangeRate(100, 101)).toBe(1);
    });
  });

  describe('getChangeRateLabel', () => {
    it('9%は横ばい（境界値）', () => {
      expect(MathHelper.getChangeRateLabel(9)).toBe('横ばい');
    });

    it('10%は上昇（境界値）', () => {
      expect(MathHelper.getChangeRateLabel(10)).toBe('上昇');
    });

    it('-10%は下降（境界値）', () => {
      expect(MathHelper.getChangeRateLabel(-10)).toBe('下降');
    });

    it('-9%は横ばい（境界値）', () => {
      expect(MathHelper.getChangeRateLabel(-9)).toBe('横ばい');
    });
  });
});
