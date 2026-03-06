import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper 移動平均・変化率', () => {
  describe('calculateMovingAverage', () => {
    it('ウィンドウ3で移動平均を算出する', () => {
      const result = MathHelper.calculateMovingAverage([1, 2, 3, 4, 5], 3);
      expect(result).toEqual([2, 3, 4]);
    });

    it('ウィンドウ2で移動平均を算出する', () => {
      const result = MathHelper.calculateMovingAverage([10, 20, 30, 40], 2);
      expect(result).toEqual([15, 25, 35]);
    });

    it('ウィンドウサイズが配列長と同じなら1要素を返す', () => {
      const result = MathHelper.calculateMovingAverage([1, 2, 3], 3);
      expect(result).toEqual([2]);
    });

    it('ウィンドウサイズが配列長より大きい場合は空配列を返す', () => {
      const result = MathHelper.calculateMovingAverage([1, 2], 3);
      expect(result).toEqual([]);
    });

    it('空配列は空配列を返す', () => {
      expect(MathHelper.calculateMovingAverage([], 3)).toEqual([]);
    });

    it('小数点以下を丸める', () => {
      const result = MathHelper.calculateMovingAverage([1, 2, 4], 3);
      // (1+2+4)/3 = 2.333... → 2.3
      expect(result[0]).toBeCloseTo(2.3, 1);
    });
  });

  describe('calculateChangeRate', () => {
    it('増加の場合は正の変化率を返す', () => {
      expect(MathHelper.calculateChangeRate(100, 150)).toBe(50);
    });

    it('減少の場合は負の変化率を返す', () => {
      expect(MathHelper.calculateChangeRate(100, 50)).toBe(-50);
    });

    it('変化なしの場合は0を返す', () => {
      expect(MathHelper.calculateChangeRate(100, 100)).toBe(0);
    });

    it('基準値が0の場合は0を返す', () => {
      expect(MathHelper.calculateChangeRate(0, 100)).toBe(0);
    });

    it('倍増の場合は100を返す', () => {
      expect(MathHelper.calculateChangeRate(50, 100)).toBe(100);
    });
  });

  describe('getChangeRateLabel', () => {
    it('10%以上の増加は上昇を返す', () => {
      expect(MathHelper.getChangeRateLabel(15)).toBe('上昇');
    });

    it('10%以上の減少は下降を返す', () => {
      expect(MathHelper.getChangeRateLabel(-15)).toBe('下降');
    });

    it('10%未満の変化は横ばいを返す', () => {
      expect(MathHelper.getChangeRateLabel(5)).toBe('横ばい');
    });

    it('0%は横ばいを返す', () => {
      expect(MathHelper.getChangeRateLabel(0)).toBe('横ばい');
    });
  });
});
