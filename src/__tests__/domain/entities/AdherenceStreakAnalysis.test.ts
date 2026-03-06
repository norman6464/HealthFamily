import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Streak Analysis', () => {
  describe('getLongestStreak', () => {
    it('全て達成で配列長を返す', () => {
      expect(AdherenceTrendEntity.getLongestStreak([true, true, true, true, true])).toBe(5);
    });

    it('途中で途切れる場合最長を返す', () => {
      expect(AdherenceTrendEntity.getLongestStreak([true, true, false, true, true, true])).toBe(3);
    });

    it('全て未達成で0を返す', () => {
      expect(AdherenceTrendEntity.getLongestStreak([false, false, false])).toBe(0);
    });

    it('空配列で0を返す', () => {
      expect(AdherenceTrendEntity.getLongestStreak([])).toBe(0);
    });

    it('1要素trueで1を返す', () => {
      expect(AdherenceTrendEntity.getLongestStreak([true])).toBe(1);
    });
  });

  describe('getCurrentStreak', () => {
    it('末尾から連続する達成数を返す', () => {
      expect(AdherenceTrendEntity.getCurrentStreak([false, true, true, true])).toBe(3);
    });

    it('末尾が未達成なら0を返す', () => {
      expect(AdherenceTrendEntity.getCurrentStreak([true, true, false])).toBe(0);
    });

    it('全て達成で配列長を返す', () => {
      expect(AdherenceTrendEntity.getCurrentStreak([true, true, true])).toBe(3);
    });

    it('空配列で0を返す', () => {
      expect(AdherenceTrendEntity.getCurrentStreak([])).toBe(0);
    });
  });

  describe('getStreakLabel', () => {
    it('0日で「記録なし」を返す', () => {
      expect(AdherenceTrendEntity.getStreakLabel(0)).toBe('記録なし');
    });

    it('3日で「3日連続」を返す', () => {
      expect(AdherenceTrendEntity.getStreakLabel(3)).toBe('3日連続');
    });

    it('7日で「1週間連続」を返す', () => {
      expect(AdherenceTrendEntity.getStreakLabel(7)).toBe('1週間連続');
    });

    it('14日で「2週間連続」を返す', () => {
      expect(AdherenceTrendEntity.getStreakLabel(14)).toBe('2週間連続');
    });

    it('30日で「1ヶ月連続」を返す', () => {
      expect(AdherenceTrendEntity.getStreakLabel(30)).toBe('1ヶ月連続');
    });

    it('10日で「10日連続」を返す', () => {
      expect(AdherenceTrendEntity.getStreakLabel(10)).toBe('10日連続');
    });
  });
});
