import { describe, it, expect } from 'vitest';
import { MedicationEntity, Medication } from '@/domain/entities/Medication';

const createMedication = (overrides: Partial<Medication> = {}): Medication => ({
  id: 'med-1',
  memberId: 'member-1',
  userId: 'user-1',
  name: '薬A',
  category: 'regular',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('MedicationEntity 表示サマリー', () => {
  describe('getDosageSummary', () => {
    it('用量と頻度の両方がある場合は結合して返す', () => {
      const entity = new MedicationEntity(createMedication({ dosage: '1錠', frequency: '1日3回' }));
      expect(entity.getDosageSummary()).toBe('1錠 / 1日3回');
    });

    it('用量のみの場合は用量だけ返す', () => {
      const entity = new MedicationEntity(createMedication({ dosage: '1錠' }));
      expect(entity.getDosageSummary()).toBe('1錠');
    });

    it('頻度のみの場合は頻度だけ返す', () => {
      const entity = new MedicationEntity(createMedication({ frequency: '1日3回' }));
      expect(entity.getDosageSummary()).toBe('1日3回');
    });

    it('両方なしの場合は空文字を返す', () => {
      const entity = new MedicationEntity(createMedication());
      expect(entity.getDosageSummary()).toBe('');
    });
  });

  describe('getStockStatus', () => {
    it('在庫未設定はunknownを返す', () => {
      const entity = new MedicationEntity(createMedication());
      expect(entity.getStockStatus()).toBe('unknown');
    });

    it('在庫0はcriticalを返す', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 0 }));
      expect(entity.getStockStatus()).toBe('critical');
    });

    it('在庫5以下はlowを返す', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 5 }));
      expect(entity.getStockStatus()).toBe('low');
    });

    it('在庫6以上はsafeを返す', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 6 }));
      expect(entity.getStockStatus()).toBe('safe');
    });

    it('在庫100はsafeを返す', () => {
      const entity = new MedicationEntity(createMedication({ stockQuantity: 100 }));
      expect(entity.getStockStatus()).toBe('safe');
    });
  });

  describe('getStockStatusLabel', () => {
    it('safeは「十分」を返す', () => {
      expect(MedicationEntity.getStockStatusLabel('safe')).toBe('十分');
    });

    it('lowは「残りわずか」を返す', () => {
      expect(MedicationEntity.getStockStatusLabel('low')).toBe('残りわずか');
    });

    it('criticalは「在庫切れ」を返す', () => {
      expect(MedicationEntity.getStockStatusLabel('critical')).toBe('在庫切れ');
    });

    it('unknownは「未設定」を返す', () => {
      expect(MedicationEntity.getStockStatusLabel('unknown')).toBe('未設定');
    });
  });
});
