import { describe, it, expect } from 'vitest';
import { StockAlertEntity, StockAlert } from '@/domain/entities/StockAlert';

const createAlert = (overrides: Partial<StockAlert> = {}): StockAlert => ({
  medicationId: 'med-1',
  medicationName: '薬A',
  memberId: 'member-1',
  memberName: '太郎',
  stockQuantity: 10,
  stockAlertDate: '2026-03-10',
  daysUntilAlert: 5,
  isOverdue: false,
  ...overrides,
});

describe('StockAlertEntity 一括分析 エッジケース', () => {
  describe('getAlertSummary', () => {
    it('全てurgentの場合', () => {
      const alerts = [
        createAlert({ isOverdue: true }),
        createAlert({ daysUntilAlert: 0, isOverdue: true }),
        createAlert({ daysUntilAlert: 3 }),
      ];
      const result = StockAlertEntity.getAlertSummary(alerts);
      expect(result.urgent).toBe(3);
      expect(result.warning).toBe(0);
      expect(result.normal).toBe(0);
    });

    it('境界値3日はurgent、4日はwarning', () => {
      const alerts = [
        createAlert({ daysUntilAlert: 3 }),
        createAlert({ daysUntilAlert: 4 }),
      ];
      const result = StockAlertEntity.getAlertSummary(alerts);
      expect(result.urgent).toBe(1);
      expect(result.warning).toBe(1);
    });

    it('境界値7日はwarning、8日はnormal', () => {
      const alerts = [
        createAlert({ daysUntilAlert: 7 }),
        createAlert({ daysUntilAlert: 8 }),
      ];
      const result = StockAlertEntity.getAlertSummary(alerts);
      expect(result.warning).toBe(1);
      expect(result.normal).toBe(1);
    });
  });

  describe('getNextAlertDate', () => {
    it('全て同一日付の場合はその日付を返す', () => {
      const alerts = [
        createAlert({ stockAlertDate: '2026-03-10' }),
        createAlert({ stockAlertDate: '2026-03-10' }),
      ];
      expect(StockAlertEntity.getNextAlertDate(alerts)).toBe('2026-03-10');
    });
  });

  describe('formatRemainingDays', () => {
    it('21日はあと3週間を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(21)).toBe('あと3週間');
    });

    it('60日はあと2ヶ月を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(60)).toBe('あと2ヶ月');
    });

    it('8日は週単位にならずあと8日を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(8)).toBe('あと8日');
    });

    it('31日は月単位にならずあと31日を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(31)).toBe('あと31日');
    });
  });
});
