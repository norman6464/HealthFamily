import { describe, it, expect } from 'vitest';
import { MedicationEntity, MedicationCategory } from '@/domain/entities/Medication';

describe('MedicationEntity 在庫ステータス エッジケース', () => {
  describe('getMedicationSummary', () => {
    it('全カテゴリで正しいラベルを返す', () => {
      const categories: MedicationCategory[] = ['regular', 'supplement', 'prn', 'inhaler', 'flea_tick', 'heartworm'];
      for (const cat of categories) {
        const result = MedicationEntity.getMedicationSummary(cat, 5);
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain('5');
      }
    });

    it('大量在庫でも正しく表示する', () => {
      const result = MedicationEntity.getMedicationSummary('regular', 9999);
      expect(result).toContain('9999');
    });
  });

  describe('getStockStatusColor', () => {
    it('全ステータスで非空文字列を返す', () => {
      const statuses: ('safe' | 'low' | 'critical' | 'unknown')[] = ['safe', 'low', 'critical', 'unknown'];
      for (const status of statuses) {
        expect(MedicationEntity.getStockStatusColor(status).length).toBeGreaterThan(0);
      }
    });
  });
});
