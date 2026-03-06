import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Consecutive Failures', () => {
  describe('getConsecutiveFailures', () => {
    it('空配列は0', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([])).toBe(0);
    });

    it('全て達成は0', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([true, true, true])).toBe(0);
    });

    it('全て未達成は全件数', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([false, false, false])).toBe(3);
    });

    it('末尾1件が未達成', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([true, true, false])).toBe(1);
    });

    it('末尾3件が未達成', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([true, false, false, false])).toBe(3);
    });

    it('途中に達成がある場合は末尾からカウント', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([false, false, true, false, false])).toBe(2);
    });

    it('1件のみ達成', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([true])).toBe(0);
    });

    it('1件のみ未達成', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([false])).toBe(1);
    });

    it('末尾が達成で終わる場合は0', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailures([false, false, true])).toBe(0);
    });
  });

  describe('getConsecutiveFailuresLabel', () => {
    it('0回は良好', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(0)).toBe('良好');
    });

    it('2回は注意', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(2)).toBe('注意');
    });

    it('5回は警告', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(5)).toBe('警告');
    });

    it('10回は危険', () => {
      expect(AdherenceTrendEntity.getConsecutiveFailuresLabel(10)).toBe('危険');
    });
  });
});
