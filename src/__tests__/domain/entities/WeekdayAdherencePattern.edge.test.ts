import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Weekday Adherence Pattern Edge Cases', () => {
  describe('getWeekdayAdherencePattern', () => {
    it('範囲外の曜日は無視される', () => {
      const records = [{ dayOfWeek: -1 }, { dayOfWeek: 7 }, { dayOfWeek: 100 }];
      const result = MedicationRecordEntity.getWeekdayAdherencePattern(records, 7);
      result.forEach((day) => {
        expect(day.count).toBe(0);
      });
    });

    it('大量の記録を処理できる', () => {
      const records = Array.from({ length: 1000 }, (_, i) => ({ dayOfWeek: i % 7 }));
      const result = MedicationRecordEntity.getWeekdayAdherencePattern(records, 1000);
      result.forEach((day) => {
        expect(day.count).toBeGreaterThanOrEqual(142);
      });
    });

    it('日数0でも動作する', () => {
      const result = MedicationRecordEntity.getWeekdayAdherencePattern([], 0);
      expect(result).toHaveLength(7);
    });
  });

  describe('getWeekdayPatternLabel', () => {
    it('全て0件は均等', () => {
      const pattern = [
        { label: '日', count: 0 },
        { label: '月', count: 0 },
        { label: '火', count: 0 },
        { label: '水', count: 0 },
        { label: '木', count: 0 },
        { label: '金', count: 0 },
        { label: '土', count: 0 },
      ];
      expect(MedicationRecordEntity.getWeekdayPatternLabel(pattern)).toBe('均等');
    });

    it('平日のみ1件ずつは平日中心', () => {
      const pattern = [
        { label: '日', count: 0 },
        { label: '月', count: 1 },
        { label: '火', count: 1 },
        { label: '水', count: 1 },
        { label: '木', count: 1 },
        { label: '金', count: 1 },
        { label: '土', count: 0 },
      ];
      expect(MedicationRecordEntity.getWeekdayPatternLabel(pattern)).toBe('平日中心');
    });

    it('7件未満のパターンは均等', () => {
      const pattern = [
        { label: '日', count: 5 },
        { label: '月', count: 0 },
      ];
      expect(MedicationRecordEntity.getWeekdayPatternLabel(pattern)).toBe('均等');
    });

    it('土日のみ大量記録は休日中心', () => {
      const pattern = [
        { label: '日', count: 10 },
        { label: '月', count: 1 },
        { label: '火', count: 0 },
        { label: '水', count: 0 },
        { label: '木', count: 0 },
        { label: '金', count: 0 },
        { label: '土', count: 10 },
      ];
      expect(MedicationRecordEntity.getWeekdayPatternLabel(pattern)).toBe('休日中心');
    });
  });
});
