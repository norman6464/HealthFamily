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

describe('StockAlertEntity 一括分析', () => {
  describe('getAlertSummary', () => {
    it('空配列は全て0を返す', () => {
      const result = StockAlertEntity.getAlertSummary([]);
      expect(result).toEqual({ urgent: 0, warning: 0, normal: 0 });
    });

    it('緊急度別に集計する', () => {
      const alerts = [
        createAlert({ daysUntilAlert: 1, isOverdue: false }),
        createAlert({ daysUntilAlert: 5, isOverdue: false }),
        createAlert({ daysUntilAlert: 10, isOverdue: false }),
        createAlert({ daysUntilAlert: -1, isOverdue: true }),
      ];
      const result = StockAlertEntity.getAlertSummary(alerts);
      expect(result.urgent).toBe(2); // 1日 + 期限超過
      expect(result.warning).toBe(1); // 5日
      expect(result.normal).toBe(1); // 10日
    });
  });

  describe('getNextAlertDate', () => {
    it('空配列はnullを返す', () => {
      expect(StockAlertEntity.getNextAlertDate([])).toBeNull();
    });

    it('最も近い未来のアラート日を返す', () => {
      const alerts = [
        createAlert({ stockAlertDate: '2026-03-10', isOverdue: false }),
        createAlert({ stockAlertDate: '2026-03-05', isOverdue: false }),
        createAlert({ stockAlertDate: '2026-03-15', isOverdue: false }),
      ];
      expect(StockAlertEntity.getNextAlertDate(alerts)).toBe('2026-03-05');
    });

    it('期限超過のアラートは除外しない', () => {
      const alerts = [
        createAlert({ stockAlertDate: '2026-03-01', isOverdue: true }),
        createAlert({ stockAlertDate: '2026-03-10', isOverdue: false }),
      ];
      expect(StockAlertEntity.getNextAlertDate(alerts)).toBe('2026-03-01');
    });
  });

  describe('formatRemainingDays', () => {
    it('0日は今日を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(0)).toBe('今日');
    });

    it('1日はあと1日を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(1)).toBe('あと1日');
    });

    it('7日はあと1週間を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(7)).toBe('あと1週間');
    });

    it('14日はあと2週間を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(14)).toBe('あと2週間');
    });

    it('30日はあと1ヶ月を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(30)).toBe('あと1ヶ月');
    });

    it('負の値は期限超過を返す', () => {
      expect(StockAlertEntity.formatRemainingDays(-3)).toBe('3日超過');
    });
  });
});
