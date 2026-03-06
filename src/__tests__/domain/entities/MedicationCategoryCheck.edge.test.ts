import { MedicationEntity } from '@/domain/entities/Medication';
import type { MedicationCategory } from '@/domain/entities/Medication';

describe('MedicationEntity - Category Check Edge Cases', () => {
  describe('isSameCategory 境界値', () => {
    it('空文字同士は同じ', () => {
      expect(MedicationEntity.isSameCategory('', '')).toBe(true);
    });

    it('片方空文字は異なる', () => {
      expect(MedicationEntity.isSameCategory('regular', '')).toBe(false);
    });

    it('未知カテゴリ同士でも同じなら一致', () => {
      expect(MedicationEntity.isSameCategory('custom', 'custom')).toBe(true);
    });
  });

  describe('groupByCategory 境界値', () => {
    it('1件のみの場合1グループ', () => {
      const meds = [{ name: '薬A', category: 'regular' }];
      const groups = MedicationEntity.groupByCategory(meds);
      expect(Object.keys(groups)).toHaveLength(1);
    });

    it('未知カテゴリもグループ化される', () => {
      const meds = [
        { name: '薬A', category: 'custom1' },
        { name: '薬B', category: 'custom1' },
      ];
      const groups = MedicationEntity.groupByCategory(meds);
      expect(groups['custom1']).toHaveLength(2);
    });
  });

  describe('getCategoryCountSummary 境界値', () => {
    it('全カテゴリが含まれる場合', () => {
      const meds = [
        { name: '薬A', category: 'regular' as MedicationCategory },
        { name: '薬B', category: 'supplement' as MedicationCategory },
        { name: '薬C', category: 'prn' as MedicationCategory },
        { name: '薬D', category: 'external' as MedicationCategory },
        { name: '薬E', category: 'heartworm' as MedicationCategory },
      ];
      const summary = MedicationEntity.getCategoryCountSummary(meds);
      expect(summary).toHaveLength(5);
      expect(summary.every(s => s.count === 1)).toBe(true);
    });
  });
});
