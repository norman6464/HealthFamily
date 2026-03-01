import { describe, it, expect } from 'vitest';
import { MedicationEntity, Medication } from '@/domain/entities/Medication';

const createMedication = (overrides: Partial<Medication> = {}): Medication => ({
  id: 'med-1',
  memberId: 'member-1',
  userId: 'user-1',
  name: 'テスト薬',
  category: 'regular',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('MedicationEntity', () => {
  describe('isLowStock', () => {
    it('在庫数が警告日までの日数より少ない場合 true を返す', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const entity = new MedicationEntity(
        createMedication({ stockQuantity: 5, stockAlertDate: futureDate })
      );
      expect(entity.isLowStock()).toBe(true);
    });

    it('在庫数が警告日までの日数以上の場合 false を返す', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const entity = new MedicationEntity(
        createMedication({ stockQuantity: 10, stockAlertDate: futureDate })
      );
      expect(entity.isLowStock()).toBe(false);
    });

    it('在庫数が未設定の場合 false を返す', () => {
      const entity = new MedicationEntity(createMedication());
      expect(entity.isLowStock()).toBe(false);
    });

    it('警告日が過去の場合 false を返す', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const entity = new MedicationEntity(
        createMedication({ stockQuantity: 3, stockAlertDate: pastDate })
      );
      expect(entity.isLowStock()).toBe(false);
    });

    it('警告日が未設定の場合 false を返す', () => {
      const entity = new MedicationEntity(
        createMedication({ stockQuantity: 3 })
      );
      expect(entity.isLowStock()).toBe(false);
    });
  });

  describe('decreaseStock', () => {
    it('在庫を1減らす', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 10 }));
      const result = entity.decreaseStock();
      expect(result.stockQuantity).toBe(9);
    });

    it('指定数量分を減らす', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 10 }));
      const result = entity.decreaseStock(3);
      expect(result.stockQuantity).toBe(7);
    });

    it('0未満にはならない', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 1 }));
      const result = entity.decreaseStock(5);
      expect(result.stockQuantity).toBe(0);
    });

    it('在庫数が未設定の場合はそのまま返す', () => {
      const med = createMedication();
      const entity = new MedicationEntity(med);
      const result = entity.decreaseStock();
      expect(result).toBe(med);
    });
  });

  describe('increaseStock', () => {
    it('在庫を増やす', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 5 }));
      const result = entity.increaseStock(10);
      expect(result.stockQuantity).toBe(15);
    });

    it('在庫数が未設定の場合はそのまま返す', () => {
      const med = createMedication();
      const entity = new MedicationEntity(med);
      const result = entity.increaseStock(5);
      expect(result).toBe(med);
    });
  });

  describe('getDisplayInfo', () => {
    it('カテゴリラベルを日本語で返す', () => {
      const entity = new MedicationEntity(createMedication({ category: 'regular' }));
      expect(entity.getDisplayInfo().categoryLabel).toBe('常用薬');
    });

    it('用量と頻度を結合して返す', () => {
      const entity = new MedicationEntity(
        createMedication({ dosage: '1錠', frequency: '1日2回' })
      );
      expect(entity.getDisplayInfo().dosageInfo).toBe('1錠 / 1日2回');
    });

    it('用量のみの場合はそのまま返す', () => {
      const entity = new MedicationEntity(createMedication({ dosage: '1錠' }));
      expect(entity.getDisplayInfo().dosageInfo).toBe('1錠');
    });

    it('頻度のみの場合はそのまま返す', () => {
      const entity = new MedicationEntity(createMedication({ frequency: '1日3回' }));
      expect(entity.getDisplayInfo().dosageInfo).toBe('1日3回');
    });

    it('用量・頻度どちらもない場合は空文字を返す', () => {
      const entity = new MedicationEntity(createMedication());
      expect(entity.getDisplayInfo().dosageInfo).toBe('');
    });

    it('全カテゴリのラベルが正しい', () => {
      const cases: [Medication['category'], string][] = [
        ['regular', '常用薬'],
        ['supplement', 'サプリメント'],
        ['prn', '頓服薬'],
        ['inhaler', '吸入薬'],
        ['flea_tick', 'ノミ・ダニ薬'],
        ['heartworm', 'フィラリア薬'],
      ];
      for (const [category, label] of cases) {
        const entity = new MedicationEntity(createMedication({ category }));
        expect(entity.getDisplayInfo().categoryLabel).toBe(label);
      }
    });

    it('名前が正しく返される', () => {
      const entity = new MedicationEntity(createMedication({ name: 'ロキソニン' }));
      expect(entity.getDisplayInfo().name).toBe('ロキソニン');
    });
  });

  describe('isLowStock (境界値)', () => {
    it('在庫数が警告日までの日数と等しい場合 false を返す', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const entity = new MedicationEntity(
        createMedication({ stockQuantity: 5, stockAlertDate: futureDate })
      );
      expect(entity.isLowStock()).toBe(false);
    });
  });

  describe('id / name / data', () => {
    it('プロパティにアクセスできる', () => {
      const med = createMedication({ id: 'med-xyz', name: 'アスピリン' });
      const entity = new MedicationEntity(med);
      expect(entity.id).toBe('med-xyz');
      expect(entity.name).toBe('アスピリン');
      expect(entity.data).toBe(med);
    });
  });
});
