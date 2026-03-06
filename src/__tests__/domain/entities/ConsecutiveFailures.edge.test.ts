import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Consecutive Failures Edge Cases', () => {
  describe('getConsecutiveFailures', () => {
    it('大量の未達成', () => {
      const results = Array.from({ length: 100 }, () => false);
      expect(AdherenceTrendEntity.getConsecutiveFailures(results)).toBe(100);
    });

    it('大量の達成後に1件未達成', () => {
      const results = Array.from({ length: 99 }, () => true);
      results.push(false);
      expect(AdherenceTrendEntity.getConsecutiveFailures(results)).toBe(1);
    });

    it('交互パターンで末尾が未達成', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([true, false, true, false])).toBe(1);
    });

    it('交互パターンで末尾が達成', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([false, true, false, true])).toBe(0);
    });

    it('先頭のみ達成', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([true, false, false, false, false])).toBe(4);
    });

    it('末尾のみ達成', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([false, false, false, false, true])).toBe(0);
    });
  });

  describe('getConsecutiveFailuresLabel', () => {
    it('1回は注意', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(1)).toBe('注意');
    });

    it('2回は注意', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(2)).toBe('注意');
    });

    it('3回は警告（閾値境界）', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(3)).toBe('警告');
    });

    it('6回は警告', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(6)).toBe('警告');
    });

    it('7回は危険（閾値境界）', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(7)).toBe('危険');
    });

    it('100回は危険', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(100)).toBe('危険');
    });
  });
});
