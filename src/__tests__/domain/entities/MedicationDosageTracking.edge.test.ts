import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Dosage Tracking Edge Cases', () => {
  describe('getDailyDosageCount', () => {
    it('同じ薬が大量にある場合', () => {
      const records = Array(50).fill({ medicationName: '薬A', date: '2026-03-06' });
      const result = MedicationRecordEntity.getDailyDosageCount(records, '2026-03-06');
      expect(result['薬A']).toBe(50);
    });

    it('複数の薬が混在', () => {
      const records = [
        { medicationName: '薬A', date: '2026-03-06' },
        { medicationName: '薬B', date: '2026-03-06' },
        { medicationName: '薬C', date: '2026-03-06' },
      ];
      const result = MedicationRecordEntity.getDailyDosageCount(records, '2026-03-06');
      expect(Object.keys(result)).toHaveLength(3);
    });

    it('異なる日付の記録は含まれない', () => {
      const records = [
        { medicationName: '薬A', date: '2026-03-05' },
        { medicationName: '薬A', date: '2026-03-07' },
      ];
      const result = MedicationRecordEntity.getDailyDosageCount(records, '2026-03-06');
      expect(result).toEqual({});
    });
  });

  describe('getDosageCategoryLabel', () => {
    it('2回は少なめ', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(2)).toBe('少なめ');
    });

    it('4回は標準', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(4)).toBe('標準');
    });

    it('6回は多め', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(6)).toBe('多め');
    });

    it('7回は非常に多い', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(7)).toBe('非常に多い');
    });

    it('100回は非常に多い', () => {
      expect(MedicationRecordEntity.getDosageCategoryLabel(100)).toBe('非常に多い');
    });
  });
});
