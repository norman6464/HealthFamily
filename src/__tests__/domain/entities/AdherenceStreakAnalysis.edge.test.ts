import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Streak Analysis Edge Cases', () => {
  describe('getLongestStreak', () => {
    it('交互パターンで最長1', () => {
      expect(AdherenceTrendEntity.getLongestStreak([true, false, true, false, true])).toBe(1);
    });

    it('末尾に最長ストリーク', () => {
      expect(AdherenceTrendEntity.getLongestStreak([false, true, true, true, true])).toBe(4);
    });

    it('先頭に最長ストリーク', () => {
      expect(AdherenceTrendEntity.getLongestStreak([true, true, true, false, true])).toBe(3);
    });

    it('100要素の全true', () => {
      const data = new Array(100).fill(true);
      expect(AdherenceTrendEntity.getLongestStreak(data)).toBe(100);
    });
  });

  describe('getCurrentStreak', () => {
    it('1要素falseで0', () => {
      expect(AdherenceTrendEntity.getCurrentStreak([false])).toBe(0);
    });

    it('1要素trueで1', () => {
      expect(AdherenceTrendEntity.getCurrentStreak([true])).toBe(1);
    });

    it('長い配列の末尾ストリーク', () => {
      const data = [false, false, true, true, true, true, true];
      expect(AdherenceTrendEntity.getCurrentStreak(data)).toBe(5);
    });
  });

  describe('getStreakLabel', () => {
    it('1日で「1日連続」', () => {
      expect(AdherenceTrendEntity.getStreakLabel(1)).toBe('1日連続');
    });

    it('21日で「3週間連続」', () => {
      expect(AdherenceTrendEntity.getStreakLabel(21)).toBe('3週間連続');
    });

    it('28日で「4週間連続」', () => {
      expect(AdherenceTrendEntity.getStreakLabel(28)).toBe('4週間連続');
    });

    it('31日で「1ヶ月連続」', () => {
      expect(AdherenceTrendEntity.getStreakLabel(31)).toBe('1ヶ月連続');
    });

    it('8日で「8日連続」(7の倍数でない)', () => {
      expect(AdherenceTrendEntity.getStreakLabel(8)).toBe('8日連続');
    });
  });
});
