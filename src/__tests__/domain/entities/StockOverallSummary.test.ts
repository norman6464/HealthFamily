import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity 在庫全体サマリー', () => {
  describe('getOverallStockMessage', () => {
    it('アラートなしの場合は安心メッセージを返す', () => {
      expect(StockAlertEntity.getOverallStockMessage(0, 0, 0)).toBe('全ての在庫が十分です');
    });

    it('緊急のみの場合は緊急メッセージを返す', () => {
      const msg = StockAlertEntity.getOverallStockMessage(2, 0, 0);
      expect(msg).toContain('2');
      expect(msg).toContain('緊急');
    });

    it('警告のみの場合は警告メッセージを返す', () => {
      const msg = StockAlertEntity.getOverallStockMessage(0, 3, 0);
      expect(msg).toContain('3');
      expect(msg).toContain('注意');
    });

    it('注意のみの場合は注意メッセージを返す', () => {
      const msg = StockAlertEntity.getOverallStockMessage(0, 0, 1);
      expect(msg).toContain('1');
    });

    it('緊急と警告がある場合は緊急を優先する', () => {
      const msg = StockAlertEntity.getOverallStockMessage(1, 2, 0);
      expect(msg).toContain('緊急');
    });
  });

  describe('getCriticalAlertCount', () => {
    it('残り日数3以下の薬を緊急としてカウントする', () => {
      expect(StockAlertEntity.getCriticalAlertCount([0, 3, 7, null])).toBe(2);
    });

    it('残り日数3以下の薬をカウントする', () => {
      expect(StockAlertEntity.getCriticalAlertCount([0, 1, 2, 3, 4])).toBe(4);
    });

    it('全てnullの場合は0を返す', () => {
      expect(StockAlertEntity.getCriticalAlertCount([null, null])).toBe(0);
    });

    it('空配列は0を返す', () => {
      expect(StockAlertEntity.getCriticalAlertCount([])).toBe(0);
    });

    it('全て十分な場合は0を返す', () => {
      expect(StockAlertEntity.getCriticalAlertCount([10, 20, 30])).toBe(0);
    });
  });

  describe('getAlertPriorityMessage', () => {
    it('criticalは今すぐ補充メッセージを返す', () => {
      const msg = StockAlertEntity.getAlertPriorityMessage('critical');
      expect(msg).toContain('今すぐ');
    });

    it('urgentは早急メッセージを返す', () => {
      const msg = StockAlertEntity.getAlertPriorityMessage('urgent');
      expect(msg).toContain('早め');
    });

    it('warningは計画的メッセージを返す', () => {
      const msg = StockAlertEntity.getAlertPriorityMessage('warning');
      expect(msg).toContain('計画的');
    });

    it('normalは十分メッセージを返す', () => {
      const msg = StockAlertEntity.getAlertPriorityMessage('normal');
      expect(msg).toContain('十分');
    });
  });
});
