import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Completion Streak Edge Cases', () => {
  describe('getScheduleCompletionStreak', () => {
    it('全てfalseは0', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([false, false, false])).toBe(0);
    });

    it('大量データ100件連続true', () => {
      const data = Array.from({ length: 100 }, () => true);
      expect(ScheduleEntity.getScheduleCompletionStreak(data)).toBe(100);
    });

    it('最後の1件のみtrue', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([false, false, true])).toBe(1);
    });

    it('最初の1件のみtrue', () => {
      expect(ScheduleEntity.getScheduleCompletionStreak([true, false, false])).toBe(0);
    });
  });

  describe('getCompletionStreakLabel', () => {
    it('14日は2週間連続', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(14)).toBe('2週間連続');
    });

    it('21日は3週間連続', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(21)).toBe('3週間連続');
    });

    it('29日は29日連続', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(29)).toBe('29日連続');
    });

    it('31日は1ヶ月連続', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(31)).toBe('1ヶ月連続');
    });

    it('1日は1日連続', () => {
      expect(ScheduleEntity.getCompletionStreakLabel(1)).toBe('1日連続');
    });
  });
});
