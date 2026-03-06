import { MedicationEntity } from '@/domain/entities/Medication';
import type { MedicationCategory } from '@/domain/entities/Medication';

describe('MedicationEntity - Category Check', () => {
  describe('isSameCategory', () => {
    it('同じカテゴリの場合trueを返す', () => {
      expect(MedicationEntity.isSameCategory('regular', 'regular')).toBe(true);
    });

    it('異なるカテゴリの場合falseを返す', () => {
      expect(MedicationEntity.isSameCategory('regular', 'supplement')).toBe(false);
    });

    it('prnとprnは同じ', () => {
      expect(MedicationEntity.isSameCategory('prn', 'prn')).toBe(true);
    });
  });

  describe('groupByCategory', () => {
    it('カテゴリ別にグループ化する', () => {
      const meds = [
        { name: '薬A', category: 'regular' as MedicationCategory },
        { name: '薬B', category: 'supplement' as MedicationCategory },
        { name: '薬C', category: 'regular' as MedicationCategory },
      ];
      const groups = MedicationEntity.groupByCategory(meds);
      expect(Object.keys(groups)).toHaveLength(2);
      expect(groups['regular']).toHaveLength(2);
      expect(groups['supplement']).toHaveLength(1);
    });

    it('空配列は空オブジェクトを返す', () => {
      const groups = MedicationEntity.groupByCategory([]);
      expect(Object.keys(groups)).toHaveLength(0);
    });

    it('全て同じカテゴリの場合1グループ', () => {
      const meds = [
        { name: '薬A', category: 'prn' as MedicationCategory },
        { name: '薬B', category: 'prn' as MedicationCategory },
      ];
      const groups = MedicationEntity.groupByCategory(meds);
      expect(Object.keys(groups)).toHaveLength(1);
      expect(groups['prn']).toHaveLength(2);
    });

    it('全て異なるカテゴリの場合各1グループ', () => {
      const meds = [
        { name: '薬A', category: 'regular' as MedicationCategory },
        { name: '薬B', category: 'supplement' as MedicationCategory },
        { name: '薬C', category: 'prn' as MedicationCategory },
      ];
      const groups = MedicationEntity.groupByCategory(meds);
      expect(Object.keys(groups)).toHaveLength(3);
    });
  });

  describe('getCategoryCountSummary', () => {
    it('カテゴリ別の件数サマリーを返す', () => {
      const meds = [
        { name: '薬A', category: 'regular' as MedicationCategory },
        { name: '薬B', category: 'regular' as MedicationCategory },
        { name: '薬C', category: 'supplement' as MedicationCategory },
      ];
      const summary = MedicationEntity.getCategoryCountSummary(meds);
      expect(summary).toEqual([
        { category: 'regular', label: '常用薬', count: 2 },
        { category: 'supplement', label: 'サプリメント', count: 1 },
      ]);
    });

    it('空配列は空配列を返す', () => {
      expect(MedicationEntity.getCategoryCountSummary([])).toEqual([]);
    });
  });
});
