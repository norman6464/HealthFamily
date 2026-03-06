import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity 在庫全体サマリー エッジケース', () => {
  describe('getOverallStockMessage', () => {
    it('全カテゴリにアラートがある場合は緊急を優先する', () => {
      const msg = StockAlertEntity.getOverallStockMessage(1, 1, 1);
      expect(msg).toContain('緊急');
    });

    it('警告と注意のみの場合は注意を返す', () => {
      const msg = StockAlertEntity.getOverallStockMessage(0, 1, 1);
      expect(msg).toContain('注意');
    });
  });

  describe('getCriticalAlertCount', () => {
    it('全て0日の場合は全件カウントする', () => {
      expect(StockAlertEntity.getCriticalAlertCount([0, 0, 0])).toBe(3);
    });

    it('境界値4日はカウントしない', () => {
      expect(StockAlertEntity.getCriticalAlertCount([4])).toBe(0);
    });

    it('境界値3日はカウントする', () => {
      expect(StockAlertEntity.getCriticalAlertCount([3])).toBe(1);
    });
  });

  describe('getAlertPriorityMessage', () => {
    it('全ての優先度でメッセージが返る', () => {
      const priorities: ('critical' | 'urgent' | 'warning' | 'normal')[] = ['critical', 'urgent', 'warning', 'normal'];
      for (const p of priorities) {
        expect(StockAlertEntity.getAlertPriorityMessage(p)).toBeTruthy();
      }
    });
  });
});
