import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Dosage Tracking', () => {
  describe('getDailyDosageCount', () => {
    it('同じ薬の日別服薬回数を集計', () => {
      const records = [
        { medicationName: '薬A', date: '2026-03-06' },
        { medicationName: '薬A', date: '2026-03-06' },
        { medicationName: '薬B', date: '2026-03-06' },
        { medicationName: '薬A', date: '2026-03-05' },
      ];
      const result = MedicationRecordEntity.getDailyDosageCount(records, '2026-03-06');
      expect(result).toEqual({ '薬A': 2, '薬B': 1 });
    });

    it('該当日の記録がない場合は空オブジェクト', () => {
      const records = [{ medicationName: '薬A', date: '2026-03-05' }];
      const result = MedicationRecordEntity.getDailyDosageCount(records, '2026-03-06');
      expect(result).toEqual({});
    });

    it('空配列は空オブジェクト', () => {
      expect(MedicationRecordEntity.getDailyDosageCount([], '2026-03-06')).toEqual({});
    });
  });

  describe('getDosageCategoryLabel', () => {
    it('1回は少なめ', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(1)).toBe('少なめ');
    });

    it('3回は標準', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(3)).toBe('標準');
    });

    it('5回は多め', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(5)).toBe('多め');
    });

    it('8回は非常に多い', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(8)).toBe('非常に多い');
    });

    it('0回はなし', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(0)).toBe('なし');
    });
  });
});
