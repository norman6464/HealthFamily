import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper 統計拡張', () => {
  describe('calculateStdDev', () => {
    it('空配列は0を返す', () => {
      expect(MathHelper.calculateStdDev([])).toBe(0);
    });

    it('1要素は0を返す', () => {
      expect(MathHelper.calculateStdDev([5])).toBe(0);
    });

    it('同じ値の配列は0を返す', () => {
      expect(MathHelper.calculateStdDev([3, 3, 3])).toBe(0);
    });

    it('[2, 4, 4, 4, 5, 5, 7, 9]の標準偏差を計算する', () => {
      const result = MathHelper.calculateStdDev([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(result).toBeGreaterThan(1.5);
      expect(result).toBeLessThan(2.5);
    });

    it('[1, 2, 3, 4, 5]の標準偏差を計算する', () => {
      const result = MathHelper.calculateStdDev([1, 2, 3, 4, 5]);
      expect(result).toBeGreaterThan(1);
      expect(result).toBeLessThan(2);
    });
  });

  describe('calculateMode', () => {
    it('空配列はnullを返す', () => {
      expect(MathHelper.calculateMode([])).toBeNull();
    });

    it('1要素はその値を返す', () => {
      expect(MathHelper.calculateMode([5])).toBe(5);
    });

    it('最頻値を正しく返す', () => {
      expect(MathHelper.calculateMode([1, 2, 2, 3, 3, 3])).toBe(3);
    });

    it('全て同じ頻度の場合は最初の値を返す', () => {
      expect(MathHelper.calculateMode([1, 2, 3])).toBe(1);
    });

    it('2つの最頻値がある場合は最初に出現した方を返す', () => {
      expect(MathHelper.calculateMode([1, 1, 2, 2, 3])).toBe(1);
    });
  });

  describe('getVariabilityLabel', () => {
    it('標準偏差0は安定を返す', () => {
      expect(MathHelper.getVariabilityLabel(0)).toBe('安定');
    });

    it('標準偏差1以下は安定を返す', () => {
      expect(MathHelper.getVariabilityLabel(1)).toBe('安定');
    });

    it('標準偏差2はやや不安定を返す', () => {
      expect(MathHelper.getVariabilityLabel(2)).toBe('やや不安定');
    });

    it('標準偏差3以上は不安定を返す', () => {
      expect(MathHelper.getVariabilityLabel(3)).toBe('不安定');
    });
  });
});
