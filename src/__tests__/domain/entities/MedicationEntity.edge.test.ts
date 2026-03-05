import { describe, it, expect } from 'vitest';
import { MedicationEntity, Medication } from '@/domain/entities/Medication';

const createMedication = (overrides: Partial<Medication> = {}): Medication => ({
  id: 'med-1',
  memberId: 'member-1',
  userId: 'user-1',
  name: 'テスト薬',
  category: 'regular',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('MedicationEntity エッジケーステスト', () => {
  describe('decreaseStock 境界値', () => {
    it('在庫0から減らしても0のまま', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 0 }));
      const result = entity.decreaseStock(1);
      expect(result.stockQuantity).toBe(0);
    });

    it('在庫1から1減らすと0になる', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 1 }));
      const result = entity.decreaseStock(1);
      expect(result.stockQuantity).toBe(0);
    });

    it('在庫より多く減らしても0になる(負にならない)', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 3 }));
      const result = entity.decreaseStock(10);
      expect(result.stockQuantity).toBe(0);
    });

    it('デフォルト引数で1減る', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 5 }));
      const result = entity.decreaseStock();
      expect(result.stockQuantity).toBe(4);
    });

    it('stockQuantity未設定の場合は元のデータをそのまま返す', () => {
      const med = createMedication();
      const entity = new MedicationEntity(med);
      const result = entity.decreaseStock(1);
      expect(result).toBe(med);
    });
  });

  describe('increaseStock 境界値', () => {
    it('0に追加できる', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 0 }));
      const result = entity.increaseStock(10);
      expect(result.stockQuantity).toBe(10);
    });

    it('stockQuantity未設定の場合は元のデータをそのまま返す', () => {
      const med = createMedication();
      const entity = new MedicationEntity(med);
      const result = entity.increaseStock(5);
      expect(result).toBe(med);
    });

    it('大量追加できる', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 100 }));
      const result = entity.increaseStock(9999);
      expect(result.stockQuantity).toBe(10099);
    });
  });

  describe('isLowStock 境界値', () => {
    it('stockQuantity未設定はfalse', () => {
      const entity = new MedicationEntity(createMedication({ stockAlertDate: new Date('2026-03-15') }));
      expect(entity.isLowStock()).toBe(false);
    });

    it('stockAlertDate未設定はfalse', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 5 }));
      expect(entity.isLowStock()).toBe(false);
    });

    it('両方未設定はfalse', () => {
      const entity = new MedicationEntity(createMedication());
      expect(entity.isLowStock()).toBe(false);
    });
  });

  describe('getDisplayInfo', () => {
    it('dosageとfrequency両方あるとスラッシュ区切り', () => {
      const entity = new MedicationEntity(
        createMedication({ dosage: '1錠', frequency: '1日3回' }),
      );
      const info = entity.getDisplayInfo();
      expect(info.dosageInfo).toBe('1錠 / 1日3回');
    });

    it('dosageのみの場合', () => {
      const entity = new MedicationEntity(createMedication({ dosage: '2錠' }));
      const info = entity.getDisplayInfo();
      expect(info.dosageInfo).toBe('2錠');
    });

    it('frequencyのみの場合', () => {
      const entity = new MedicationEntity(createMedication({ frequency: '毎食後' }));
      const info = entity.getDisplayInfo();
      expect(info.dosageInfo).toBe('毎食後');
    });

    it('両方未設定の場合は空文字', () => {
      const entity = new MedicationEntity(createMedication());
      const info = entity.getDisplayInfo();
      expect(info.dosageInfo).toBe('');
    });

    it('categoryLabelが正しい', () => {
      const entity = new MedicationEntity(createMedication({ category: 'supplement' }));
      const info = entity.getDisplayInfo();
      expect(info.categoryLabel).toBe('サプリメント');
    });
  });

  describe('getCategoryLabel', () => {
    it('全カテゴリのラベルが取得できる', () => {
      expect(MedicationEntity.getCategoryLabel('regular')).toBe('常用薬');
      expect(MedicationEntity.getCategoryLabel('supplement')).toBe('サプリメント');
      expect(MedicationEntity.getCategoryLabel('prn')).toBe('頓服薬');
      expect(MedicationEntity.getCategoryLabel('inhaler')).toBe('吸入薬');
      expect(MedicationEntity.getCategoryLabel('flea_tick')).toBe('ノミ・ダニ薬');
      expect(MedicationEntity.getCategoryLabel('heartworm')).toBe('フィラリア薬');
    });
  });

  describe('getAllCategories', () => {
    it('6カテゴリ分のデータを返す', () => {
      const categories = MedicationEntity.getAllCategories();
      expect(categories).toHaveLength(6);
    });

    it('各カテゴリにidとlabelが含まれる', () => {
      const categories = MedicationEntity.getAllCategories();
      for (const cat of categories) {
        expect(cat.id).toBeTruthy();
        expect(cat.label).toBeTruthy();
      }
    });
  });
});
