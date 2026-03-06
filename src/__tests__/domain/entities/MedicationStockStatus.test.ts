import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity 在庫ステータス', () => {
  describe('getStockStatusColor', () => {
    it('safeは緑色クラスを返す', () => {
      const result = MedicationEntity.getStockStatusColor('safe');
      expect(result).toContain('green');
    });

    it('lowはオレンジ色クラスを返す', () => {
      const result = MedicationEntity.getStockStatusColor('low');
      expect(result).toContain('orange');
    });

    it('criticalは赤色クラスを返す', () => {
      const result = MedicationEntity.getStockStatusColor('critical');
      expect(result).toContain('red');
    });

    it('unknownはグレー色クラスを返す', () => {
      const result = MedicationEntity.getStockStatusColor('unknown');
      expect(result).toContain('gray');
    });
  });

  describe('getMedicationSummary', () => {
    it('カテゴリと在庫状態を含むサマリーを返す', () => {
      const result = MedicationEntity.getMedicationSummary('regular', 10);
      expect(result).toContain('常用薬');
      expect(result).toContain('10');
    });

    it('在庫未設定の場合は未設定を含む', () => {
      const result = MedicationEntity.getMedicationSummary('supplement', undefined);
      expect(result).toContain('サプリメント');
      expect(result).toContain('未設定');
    });

    it('在庫0の場合は在庫切れを含む', () => {
      const result = MedicationEntity.getMedicationSummary('prn', 0);
      expect(result).toContain('在庫切れ');
    });
  });

  describe('isActive check', () => {
    it('アクティブフラグの判定', () => {
      expect(MedicationEntity.getActiveStatusLabel(true)).toBe('有効');
      expect(MedicationEntity.getActiveStatusLabel(false)).toBe('無効');
    });
  });
});
