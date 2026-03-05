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

  describe('calculateRemainingDays', () => {
    it('在庫数と1日消費量から残日数を算出する', () => {
      expect(StockAlertEntity.calculateRemainingDays(30, 2)).toBe(15);
    });

    it('1日1回の場合は在庫数がそのまま残日数になる', () => {
      expect(StockAlertEntity.calculateRemainingDays(10, 1)).toBe(10);
    });

    it('1日3回の場合は在庫数の1/3が残日数になる', () => {
      expect(StockAlertEntity.calculateRemainingDays(9, 3)).toBe(3);
    });

    it('割り切れない場合は切り捨てる', () => {
      expect(StockAlertEntity.calculateRemainingDays(10, 3)).toBe(3);
    });

    it('消費量が0の場合はnullを返す', () => {
      expect(StockAlertEntity.calculateRemainingDays(10, 0)).toBeNull();
    });

    it('在庫が0の場合は0を返す', () => {
      expect(StockAlertEntity.calculateRemainingDays(0, 2)).toBe(0);
    });

    it('在庫がnullの場合はnullを返す', () => {
      expect(StockAlertEntity.calculateRemainingDays(null, 2)).toBeNull();
    });
  });

  describe('getRemainingDaysLabel', () => {
    it('残日数からラベルを生成する', () => {
      expect(StockAlertEntity.getRemainingDaysLabel(15)).toBe('約15日分');
    });

    it('0日の場合は在庫切れラベルを返す', () => {
      expect(StockAlertEntity.getRemainingDaysLabel(0)).toBe('在庫切れ');
    });

    it('nullの場合は不明ラベルを返す', () => {
      expect(StockAlertEntity.getRemainingDaysLabel(null)).toBe('残量不明');
    });
  });
});
