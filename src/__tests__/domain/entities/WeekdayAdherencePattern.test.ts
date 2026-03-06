import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Weekday Adherence Pattern', () => {
  describe('getWeekdayAdherencePattern', () => {
    it('曜日別の遵守率を算出する', () => {
      // 月水金に服薬記録あり（7日間）
      const records = [
        { dayOfWeek: 1 }, // 月
        { dayOfWeek: 3 }, // 水
        { dayOfWeek: 5 }, // 金
      ];
      const result = MedicationRecordEntity.getWeekdayAdherencePattern(records, 7);
      expect(result).toHaveLength(7);
      expect(result[1].count).toBe(1); // 月曜
      expect(result[0].count).toBe(0); // 日曜
    });

    it('空の記録は全て0', () => {
      const result = MedicationRecordEntity.getWeekdayAdherencePattern([], 7);
      expect(result).toHaveLength(7);
      result.forEach((day) => {
        expect(day.count).toBe(0);
      });
    });

    it('同じ曜日に複数記録', () => {
      const records = [
        { dayOfWeek: 1 },
        { dayOfWeek: 1 },
        { dayOfWeek: 1 },
      ];
      const result = MedicationRecordEntity.getWeekdayAdherencePattern(records, 7);
      expect(result[1].count).toBe(3);
    });

    it('全曜日に記録あり', () => {
      const records = [
        { dayOfWeek: 0 },
        { dayOfWeek: 1 },
        { dayOfWeek: 2 },
        { dayOfWeek: 3 },
        { dayOfWeek: 4 },
        { dayOfWeek: 5 },
        { dayOfWeek: 6 },
      ];
      const result = MedicationRecordEntity.getWeekdayAdherencePattern(records, 7);
      result.forEach((day) => {
        expect(day.count).toBe(1);
      });
    });

    it('曜日ラベルが正しい', () => {
      const result = MedicationRecordEntity.getWeekdayAdherencePattern([], 7);
      expect(result[0].label).toBe('日');
      expect(result[1].label).toBe('月');
      expect(result[6].label).toBe('土');
    });
  });

  describe('getWeekdayPatternLabel', () => {
    it('平日優位はラベルを返す', () => {
      const pattern = [
        { label: '日', count: 0 },
        { label: '月', count: 3 },
        { label: '火', count: 3 },
        { label: '水', count: 3 },
        { label: '木', count: 3 },
        { label: '金', count: 3 },
        { label: '土', count: 0 },
      ];
      expect(MedicationRecordEntity.getWeekdayPatternLabel(pattern)).toBe('平日中心');
    });

    it('休日優位はラベルを返す', () => {
      const pattern = [
        { label: '日', count: 5 },
        { label: '月', count: 0 },
        { label: '火', count: 0 },
        { label: '水', count: 0 },
        { label: '木', count: 0 },
        { label: '金', count: 0 },
        { label: '土', count: 5 },
      ];
      expect(MedicationRecordEntity.getWeekdayPatternLabel(pattern)).toBe('休日中心');
    });

    it('均等はラベルを返す', () => {
      const pattern = [
        { label: '日', count: 2 },
        { label: '月', count: 2 },
        { label: '火', count: 2 },
        { label: '水', count: 2 },
        { label: '木', count: 2 },
        { label: '金', count: 2 },
        { label: '土', count: 2 },
      ];
      expect(MedicationRecordEntity.getWeekdayPatternLabel(pattern)).toBe('均等');
    });
  });
});
