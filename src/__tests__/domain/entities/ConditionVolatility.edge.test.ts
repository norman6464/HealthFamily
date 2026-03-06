import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Volatility Edge Cases', () => {
  describe('getConditionVolatility', () => {
    it('2件で差が最大(1→5)は100', () => {
      expect(HealthLogEntity.getConditionVolatility([1, 5])).toBe(100);
    });

    it('2件で差が1は25', () => {
      expect(HealthLogEntity.getConditionVolatility([3, 4])).toBe(25);
    });

    it('全て同じ値は0', () => {
      expect(HealthLogEntity.getConditionVolatility([5, 5, 5, 5, 5])).toBe(0);
    });

    it('交互パターンは高スコア', () => {
      expect(HealthLogEntity.getConditionVolatility([1, 5, 1, 5])).toBe(100);
    });

    it('大量データでも動作', () => {
      const data = Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 1 : 3));
      const score = HealthLogEntity.getConditionVolatility(data);
      expect(score).toBe(50);
    });
  });

  describe('getVolatilityLabel', () => {
    it('境界値30は安定', () => {
      expect(HealthLogEntity.getVolatilityLabel(30)).toBe('安定');
    });

    it('境界値31はやや変動', () => {
      expect(HealthLogEntity.getVolatilityLabel(31)).toBe('やや変動');
    });

    it('境界値60はやや変動', () => {
      expect(HealthLogEntity.getVolatilityLabel(60)).toBe('やや変動');
    });

    it('境界値61は不安定', () => {
      expect(HealthLogEntity.getVolatilityLabel(61)).toBe('不安定');
    });
  });
});
