import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Completion Streak', () => {
  describe('getScheduleCompletionStreak', () => {
    it('全て完了なら全日数', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([true, true, true])).toBe(3);
    });

    it('最後が未完了なら0', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([true, true, false])).toBe(0);
    });

    it('途中から連続完了', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([false, true, true])).toBe(2);
    });

    it('空配列は0', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([])).toBe(0);
    });

    it('1件のみ完了', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([true])).toBe(1);
    });

    it('1件のみ未完了', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([false])).toBe(0);
    });

    it('交互パターン', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([true, false, true])).toBe(1);
    });
  });

  describe('getCompletionStreakLabel', () => {
    it('0日は記録なし', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(0)).toBe('記録なし');
    });

    it('7日は1週間連続', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(7)).toBe('1週間連続');
    });

    it('30日は1ヶ月連続', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(30)).toBe('1ヶ月連続');
    });

    it('5日はN日連続', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(5)).toBe('5日連続');
    });
  });
});
