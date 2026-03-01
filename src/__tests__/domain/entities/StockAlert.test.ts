import { describe, it, expect } from 'vitest';
import { StockAlertEntity, StockAlert } from '@/domain/entities/StockAlert';

const createAlert = (overrides: Partial<StockAlert> = {}): StockAlert => ({
  medicationId: 'med-1',
  medicationName: 'アスピリン',
  memberId: 'member-1',
  memberName: '太郎',
  stockQuantity: 5,
  stockAlertDate: '2026-03-05T00:00:00.000Z',
  daysUntilAlert: 5,
  isOverdue: false,
  ...overrides,
});

describe('StockAlertEntity', () => {
  describe('isUrgent', () => {
    it('期限超過の場合trueを返す', () => {
      const entity = new StockAlertEntity(createAlert({ isOverdue: true, daysUntilAlert: -3 }));
      expect(entity.isUrgent()).toBe(true);
    });

    it('3日以内の場合trueを返す', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 3 }));
      expect(entity.isUrgent()).toBe(true);
    });

    it('4日以上の場合falseを返す', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 4 }));
      expect(entity.isUrgent()).toBe(false);
    });

    it('daysUntilAlert=0の場合trueを返す（境界値）', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 0 }));
      expect(entity.isUrgent()).toBe(true);
    });

    it('daysUntilAlert=1の場合trueを返す', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 1 }));
      expect(entity.isUrgent()).toBe(true);
    });
  });

  describe('getDaysLabel', () => {
    it('期限超過の場合「期限超過」を返す', () => {
      const entity = new StockAlertEntity(createAlert({ isOverdue: true }));
      expect(entity.getDaysLabel()).toBe('期限超過');
    });

    it('期限内の場合「あとN日」を返す', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 7 }));
      expect(entity.getDaysLabel()).toBe('あと7日');
    });

    it('daysUntilAlert=0の場合「あと0日」を返す', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 0 }));
      expect(entity.getDaysLabel()).toBe('あと0日');
    });

    it('daysUntilAlert=1の場合「あと1日」を返す', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 1 }));
      expect(entity.getDaysLabel()).toBe('あと1日');
    });
  });

  describe('data', () => {
    it('アラートデータにアクセスできる', () => {
      const alert = createAlert();
      const entity = new StockAlertEntity(alert);
      expect(entity.data).toBe(alert);
    });
  });
});
