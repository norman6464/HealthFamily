import { describe, it, expect } from 'vitest';
import { Medication, MedicationEntity } from '../Medication';

describe('MedicationEntity', () => {
  const mockMedication: Medication = {
    id: 'med-1',
    memberId: 'member-1',
    userId: 'user-1',
    name: '血圧の薬',
    category: 'regular',
    dosage: '1錠',
    frequency: '1日1回',
    stockQuantity: 10,
    lowStockThreshold: 5,
    instructions: '食後に服用',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('isLowStock', () => {
    it('在庫がしきい値以下の場合、trueを返す', () => {
      const entity = new MedicationEntity({
        ...mockMedication,
        stockQuantity: 3,
        lowStockThreshold: 5,
      });
      expect(entity.isLowStock()).toBe(true);
    });

    it('在庫がしきい値より多い場合、falseを返す', () => {
      const entity = new MedicationEntity(mockMedication);
      expect(entity.isLowStock()).toBe(false);
    });

    it('在庫がちょうどしきい値の場合、trueを返す', () => {
      const entity = new MedicationEntity({
        ...mockMedication,
        stockQuantity: 5,
        lowStockThreshold: 5,
      });
      expect(entity.isLowStock()).toBe(true);
    });

    it('在庫数が未設定の場合、falseを返す', () => {
      const entity = new MedicationEntity({
        ...mockMedication,
        stockQuantity: undefined,
      });
      expect(entity.isLowStock()).toBe(false);
    });

    it('しきい値が未設定の場合、falseを返す', () => {
      const entity = new MedicationEntity({
        ...mockMedication,
        lowStockThreshold: undefined,
      });
      expect(entity.isLowStock()).toBe(false);
    });
  });

  describe('decreaseStock', () => {
    it('在庫を1つ減らせる', () => {
      const entity = new MedicationEntity(mockMedication);
      const updated = entity.decreaseStock();
      expect(updated.stockQuantity).toBe(9);
    });

    it('指定数量分減らせる', () => {
      const entity = new MedicationEntity(mockMedication);
      const updated = entity.decreaseStock(3);
      expect(updated.stockQuantity).toBe(7);
    });

    it('在庫が0以下にはならない', () => {
      const entity = new MedicationEntity({
        ...mockMedication,
        stockQuantity: 2,
      });
      const updated = entity.decreaseStock(5);
      expect(updated.stockQuantity).toBe(0);
    });

    it('在庫数が未設定の場合、元のデータを返す', () => {
      const medWithoutStock = { ...mockMedication, stockQuantity: undefined };
      const entity = new MedicationEntity(medWithoutStock);
      const updated = entity.decreaseStock();
      expect(updated).toEqual(medWithoutStock);
    });
  });

  describe('increaseStock', () => {
    it('在庫を増やせる', () => {
      const entity = new MedicationEntity(mockMedication);
      const updated = entity.increaseStock(5);
      expect(updated.stockQuantity).toBe(15);
    });

    it('在庫数が未設定の場合、元のデータを返す', () => {
      const medWithoutStock = { ...mockMedication, stockQuantity: undefined };
      const entity = new MedicationEntity(medWithoutStock);
      const updated = entity.increaseStock(5);
      expect(updated).toEqual(medWithoutStock);
    });
  });

  describe('getDisplayInfo', () => {
    it('薬の表示情報を取得できる', () => {
      const entity = new MedicationEntity(mockMedication);
      const info = entity.getDisplayInfo();
      expect(info.name).toBe('血圧の薬');
      expect(info.categoryLabel).toBe('常用薬');
      expect(info.dosageInfo).toBe('1錠 / 1日1回');
    });

    it('カテゴリラベルが正しく取得できる', () => {
      const categories = [
        { category: 'regular' as const, label: '常用薬' },
        { category: 'supplement' as const, label: 'サプリメント' },
        { category: 'prn' as const, label: '頓服薬' },
        { category: 'flea_tick' as const, label: 'ノミ・ダニ薬' },
        { category: 'heartworm' as const, label: 'フィラリア薬' },
      ];

      categories.forEach(({ category, label }) => {
        const entity = new MedicationEntity({ ...mockMedication, category });
        expect(entity.getDisplayInfo().categoryLabel).toBe(label);
      });
    });
  });

  describe('getters', () => {
    it('idを取得できる', () => {
      const entity = new MedicationEntity(mockMedication);
      expect(entity.id).toBe('med-1');
    });

    it('nameを取得できる', () => {
      const entity = new MedicationEntity(mockMedication);
      expect(entity.name).toBe('血圧の薬');
    });

    it('dataを取得できる', () => {
      const entity = new MedicationEntity(mockMedication);
      expect(entity.data).toEqual(mockMedication);
    });
  });
});
