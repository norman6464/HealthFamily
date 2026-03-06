import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Log Streak', () => {
  describe('getLogStreak', () => {
    it('連続記録日数を算出', () => {
      const dateKeys = ['2026-03-04', '2026-03-05', '2026-03-06'];
      expect(HealthLogEntity.getLogStreak(dateKeys, '2026-03-06')).toBe(3);
    });

    it('途切れた場合は直近の連続のみ', () => {
      const dateKeys = ['2026-03-02', '2026-03-04', '2026-03-05', '2026-03-06'];
      expect(HealthLogEntity.getLogStreak(dateKeys, '2026-03-06')).toBe(3);
    });

    it('今日の記録がない場合は0', () => {
      const dateKeys = ['2026-03-04', '2026-03-05'];
      expect(HealthLogEntity.getLogStreak(dateKeys, '2026-03-06')).toBe(0);
    });

    it('空配列は0', () => {
      expect(HealthLogEntity.getLogStreak([], '2026-03-06')).toBe(0);
    });

    it('今日のみの記録は1', () => {
      expect(HealthLogEntity.getLogStreak(['2026-03-06'], '2026-03-06')).toBe(1);
    });
  });

  describe('getLogStreakLabel', () => {
    it('0日は記録なし', () => {
      expect(HealthLogEntity.getLogStreakLabel(0)).toBe('記録なし');
    });

    it('1日は記録開始', () => {
      expect(HealthLogEntity.getLogStreakLabel(1)).toBe('記録開始');
    });

    it('3日は3日連続', () => {
      expect(HealthLogEntity.getLogStreakLabel(3)).toBe('3日連続');
    });

    it('7日は1週間連続', () => {
      expect(HealthLogEntity.getLogStreakLabel(7)).toBe('1週間連続');
    });

    it('30日は1ヶ月連続', () => {
      expect(HealthLogEntity.getLogStreakLabel(30)).toBe('1ヶ月連続');
    });
  });
});
