import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity エッジケース', () => {
  describe('calculateRemainingDays', () => {
    it('在庫nullでnullを返す', () => {
      expect(StockAlertEntity.calculateRemainingDays(null, 2)).toBeNull();
    });

    it('消費量0でnullを返す', () => {
      expect(StockAlertEntity.calculateRemainingDays(10, 0)).toBeNull();
    });

    it('消費量マイナスでnullを返す', () => {
      expect(StockAlertEntity.calculateRemainingDays(10, -1)).toBeNull();
    });

    it('在庫0で0日を返す', () => {
      expect(StockAlertEntity.calculateRemainingDays(0, 2)).toBe(0);
    });

    it('在庫が消費量より少ない場合は0日を返す', () => {
      expect(StockAlertEntity.calculateRemainingDays(1, 2)).toBe(0);
    });

    it('ちょうど割り切れる場合は正確な日数', () => {
      expect(StockAlertEntity.calculateRemainingDays(10, 2)).toBe(5);
    });

    it('割り切れない場合は切り捨て', () => {
      expect(StockAlertEntity.calculateRemainingDays(7, 2)).toBe(3);
    });

    it('大量在庫の場合', () => {
      expect(StockAlertEntity.calculateRemainingDays(1000, 3)).toBe(333);
    });
  });

  describe('getRemainingDaysLabel', () => {
    it('nullで残量不明', () => {
      expect(StockAlertEntity.getRemainingDaysLabel(null)).toBe('残量不明');
    });

    it('0で在庫切れ', () => {
      expect(StockAlertEntity.getRemainingDaysLabel(0)).toBe('在庫切れ');
    });

    it('1で約1日分', () => {
      expect(StockAlertEntity.getRemainingDaysLabel(1)).toBe('約1日分');
    });

    it('30で約30日分', () => {
      expect(StockAlertEntity.getRemainingDaysLabel(30)).toBe('約30日分');
    });
  });

  describe('isUrgent', () => {
    it('期限超過の場合はtrue', () => {
      const entity = new StockAlertEntity({
        medicationId: '1',
        medicationName: 'test',
        memberId: '1',
        memberName: 'test',
        stockQuantity: 10,
        stockAlertDate: '2026-03-01',
        daysUntilAlert: -1,
        isOverdue: true,
      });
      expect(entity.isUrgent()).toBe(true);
    });

    it('3日以内の場合はtrue', () => {
      const entity = new StockAlertEntity({
        medicationId: '1',
        medicationName: 'test',
        memberId: '1',
        memberName: 'test',
        stockQuantity: 10,
        stockAlertDate: '2026-03-08',
        daysUntilAlert: 3,
        isOverdue: false,
      });
      expect(entity.isUrgent()).toBe(true);
    });

    it('4日以上の場合はfalse', () => {
      const entity = new StockAlertEntity({
        medicationId: '1',
        medicationName: 'test',
        memberId: '1',
        memberName: 'test',
        stockQuantity: 10,
        stockAlertDate: '2026-03-10',
        daysUntilAlert: 4,
        isOverdue: false,
      });
      expect(entity.isUrgent()).toBe(false);
    });
  });
});
