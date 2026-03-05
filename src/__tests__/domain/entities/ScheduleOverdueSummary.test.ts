import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

type OverdueAlertLevel = 'good' | 'caution' | 'alert';

describe('ScheduleEntity 飲み忘れサマリー', () => {
  describe('countOverdue', () => {
    it('全て完了済みなら0を返す', () => {
      const statuses = ['completed', 'completed', 'completed'] as const;
      expect(ScheduleEntity.countOverdue(statuses)).toBe(0);
    });

    it('一部overdueがある場合、その数を返す', () => {
      const statuses = ['completed', 'overdue', 'pending', 'overdue'] as const;
      expect(ScheduleEntity.countOverdue(statuses)).toBe(2);
    });

    it('全てoverdueの場合、全件を返す', () => {
      const statuses = ['overdue', 'overdue', 'overdue'] as const;
      expect(ScheduleEntity.countOverdue(statuses)).toBe(3);
    });

    it('空配列は0を返す', () => {
      expect(ScheduleEntity.countOverdue([])).toBe(0);
    });

    it('pendingはカウントしない', () => {
      const statuses = ['pending', 'pending'] as const;
      expect(ScheduleEntity.countOverdue(statuses)).toBe(0);
    });
  });

  describe('getOverdueRate', () => {
    it('飲み忘れなしで0を返す', () => {
      expect(ScheduleEntity.getOverdueRate(0, 5)).toBe(0);
    });

    it('半分飲み忘れで50を返す', () => {
      expect(ScheduleEntity.getOverdueRate(3, 6)).toBe(50);
    });

    it('全て飲み忘れで100を返す', () => {
      expect(ScheduleEntity.getOverdueRate(4, 4)).toBe(100);
    });

    it('総数0で0を返す', () => {
      expect(ScheduleEntity.getOverdueRate(0, 0)).toBe(0);
    });

    it('端数は四捨五入する', () => {
      expect(ScheduleEntity.getOverdueRate(1, 3)).toBe(33);
    });
  });

  describe('getOverdueAlertLevel', () => {
    it('0%はgoodを返す', () => {
      expect(ScheduleEntity.getOverdueAlertLevel(0)).toBe('good' as OverdueAlertLevel);
    });

    it('29%はgoodを返す', () => {
      expect(ScheduleEntity.getOverdueAlertLevel(29)).toBe('good' as OverdueAlertLevel);
    });

    it('30%はcautionを返す(境界)', () => {
      expect(ScheduleEntity.getOverdueAlertLevel(30)).toBe('caution' as OverdueAlertLevel);
    });

    it('59%はcautionを返す', () => {
      expect(ScheduleEntity.getOverdueAlertLevel(59)).toBe('caution' as OverdueAlertLevel);
    });

    it('60%はalertを返す(境界)', () => {
      expect(ScheduleEntity.getOverdueAlertLevel(60)).toBe('alert' as OverdueAlertLevel);
    });

    it('100%はalertを返す', () => {
      expect(ScheduleEntity.getOverdueAlertLevel(100)).toBe('alert' as OverdueAlertLevel);
    });
  });
});
