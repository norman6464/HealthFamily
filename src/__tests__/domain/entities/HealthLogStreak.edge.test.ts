import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Log Streak Edge Cases', () => {
  describe('getLogStreak', () => {
    it('重複日付がある場合も正しく算出', () => {
      const dateKeys = ['2026-03-05', '2026-03-05', '2026-03-06'];
      expect(HealthLogEntity.getLogStreak(dateKeys, '2026-03-06')).toBe(2);
    });

    it('昨日の記録のみで今日がない場合は0', () => {
      expect(HealthLogEntity.getLogStreak(['2026-03-05'], '2026-03-06')).toBe(0);
    });

    it('長い連続記録', () => {
      const dateKeys: string[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date(2026, 2, 6 - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateKeys.push(`${year}-${month}-${day}`);
      }
      expect(HealthLogEntity.getLogStreak(dateKeys, '2026-03-06')).toBe(30);
    });

    it('ソートされていない入力でも正しく動作', () => {
      const dateKeys = ['2026-03-06', '2026-03-04', '2026-03-05'];
      expect(HealthLogEntity.getLogStreak(dateKeys, '2026-03-06')).toBe(3);
    });
  });

  describe('getLogStreakLabel', () => {
    it('2日は2日連続', () => {
      expect(HealthLogEntity.getLogStreakLabel(2)).toBe('2日連続');
    });

    it('14日は2週間連続', () => {
      expect(HealthLogEntity.getLogStreakLabel(14)).toBe('2週間連続');
    });

    it('60日は2ヶ月連続', () => {
      expect(HealthLogEntity.getLogStreakLabel(60)).toBe('2ヶ月連続');
    });

    it('10日は10日連続', () => {
      expect(HealthLogEntity.getLogStreakLabel(10)).toBe('10日連続');
    });

    it('21日は3週間連続', () => {
      expect(HealthLogEntity.getLogStreakLabel(21)).toBe('3週間連続');
    });
  });
});
