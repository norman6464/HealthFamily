import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper 統計拡張 エッジケース', () => {
  describe('calculateStdDev', () => {
    it('2要素の場合も正しく計算する', () => {
      const result = MathHelper.calculateStdDev([0, 10]);
      expect(result).toBe(5);
    });

    it('負の値を含む場合も正しく計算する', () => {
      const result = MathHelper.calculateStdDev([-5, 5]);
      expect(result).toBe(5);
    });
  });

  describe('calculateMode', () => {
    it('全て同じ値の場合はその値を返す', () => {
      expect(MathHelper.calculateMode([7, 7, 7])).toBe(7);
    });

    it('大きな配列で最頻値を正しく返す', () => {
      expect(MathHelper.calculateMode([1, 2, 3, 3, 3, 4, 5])).toBe(3);
    });
  });

  describe('getVariabilityLabel', () => {
    it('境界値1.0は安定', () => {
      expect(MathHelper.getVariabilityLabel(1.0)).toBe('安定');
    });

    it('境界値1.1はやや不安定', () => {
      expect(MathHelper.getVariabilityLabel(1.1)).toBe('やや不安定');
    });

    it('境界値2.9はやや不安定', () => {
      expect(MathHelper.getVariabilityLabel(2.9)).toBe('やや不安定');
    });

    it('境界値3.0は不安定', () => {
      expect(MathHelper.getVariabilityLabel(3.0)).toBe('不安定');
    });
  });
});
