import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper', () => {
  describe('calculatePercentage', () => {
    it('正常なパーセント計算', () => {
      expect(MathHelper.calculatePercentage(1, 2)).toBe(50);
    });

    it('分母0は0を返す', () => {
      expect(MathHelper.calculatePercentage(5, 0)).toBe(0);
    });

    it('分母が負は0を返す', () => {
      expect(MathHelper.calculatePercentage(5, -1)).toBe(0);
    });

    it('100%超過をそのまま返す(cap=false)', () => {
      expect(MathHelper.calculatePercentage(15, 10)).toBe(150);
    });

    it('100%超過を100に制限する(cap=true)', () => {
      expect(MathHelper.calculatePercentage(15, 10, true)).toBe(100);
    });

    it('ちょうど100%はcap有無に関わらず100', () => {
      expect(MathHelper.calculatePercentage(10, 10)).toBe(100);
      expect(MathHelper.calculatePercentage(10, 10, true)).toBe(100);
    });

    it('0/10は0を返す', () => {
      expect(MathHelper.calculatePercentage(0, 10)).toBe(0);
    });

    it('1/3は33を返す(四捨五入)', () => {
      expect(MathHelper.calculatePercentage(1, 3)).toBe(33);
    });

    it('2/3は67を返す(四捨五入)', () => {
      expect(MathHelper.calculatePercentage(2, 3)).toBe(67);
    });

    it('デフォルトはcap=false', () => {
      expect(MathHelper.calculatePercentage(200, 100)).toBe(200);
    });
  });
});
