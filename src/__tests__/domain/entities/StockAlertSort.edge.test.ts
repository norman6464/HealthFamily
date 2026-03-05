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

describe('StockAlertEntity ソート・緊急度エッジケース', () => {
  describe('sortByPriority', () => {
    it('空配列は空配列を返す', () => {
      expect(StockAlertEntity.sortByPriority([])).toEqual([]);
    });

    it('期限超過が先に来る', () => {
      const alerts = [
        createAlert({ medicationName: 'B', daysUntilAlert: 3, isOverdue: false }),
        createAlert({ medicationName: 'A', daysUntilAlert: -1, isOverdue: true }),
      ];
      const sorted = StockAlertEntity.sortByPriority(alerts);
      expect(sorted[0].medicationName).toBe('A');
    });

    it('期限超過同士は残日数順', () => {
      const alerts = [
        createAlert({ medicationName: 'B', daysUntilAlert: -3, isOverdue: true }),
        createAlert({ medicationName: 'A', daysUntilAlert: -5, isOverdue: true }),
      ];
      const sorted = StockAlertEntity.sortByPriority(alerts);
      expect(sorted[0].medicationName).toBe('A');
    });

    it('未超過同士は残日数少ない順', () => {
      const alerts = [
        createAlert({ medicationName: 'B', daysUntilAlert: 7 }),
        createAlert({ medicationName: 'A', daysUntilAlert: 2 }),
        createAlert({ medicationName: 'C', daysUntilAlert: 5 }),
      ];
      const sorted = StockAlertEntity.sortByPriority(alerts);
      expect(sorted[0].medicationName).toBe('A');
      expect(sorted[1].medicationName).toBe('C');
      expect(sorted[2].medicationName).toBe('B');
    });

    it('元の配列を変更しない(イミュータブル)', () => {
      const alerts = [
        createAlert({ medicationName: 'B', daysUntilAlert: 7 }),
        createAlert({ medicationName: 'A', daysUntilAlert: 2 }),
      ];
      StockAlertEntity.sortByPriority(alerts);
      expect(alerts[0].medicationName).toBe('B');
    });
  });

  describe('getUrgencyLabel 全境界値', () => {
    it('-1日は期限超過', () => {
      expect(StockAlertEntity.getUrgencyLabel(-1)).toBe('期限超過');
    });

    it('0日は期限超過(境界)', () => {
      expect(StockAlertEntity.getUrgencyLabel(0)).toBe('期限超過');
    });

    it('1日は残りわずか', () => {
      expect(StockAlertEntity.getUrgencyLabel(1)).toBe('残りわずか');
    });

    it('3日は残りわずか(境界)', () => {
      expect(StockAlertEntity.getUrgencyLabel(3)).toBe('残りわずか');
    });

    it('4日は注意', () => {
      expect(StockAlertEntity.getUrgencyLabel(4)).toBe('注意');
    });

    it('7日は注意(境界)', () => {
      expect(StockAlertEntity.getUrgencyLabel(7)).toBe('注意');
    });

    it('8日は余裕あり', () => {
      expect(StockAlertEntity.getUrgencyLabel(8)).toBe('余裕あり');
    });
  });

  describe('getUrgencyStyle 全境界値', () => {
    it('0日は赤系', () => {
      const style = StockAlertEntity.getUrgencyStyle(0);
      expect(style.text).toContain('red');
    });

    it('1日はオレンジ系', () => {
      const style = StockAlertEntity.getUrgencyStyle(1);
      expect(style.text).toContain('orange');
    });

    it('3日はオレンジ系(境界)', () => {
      const style = StockAlertEntity.getUrgencyStyle(3);
      expect(style.text).toContain('orange');
    });

    it('4日は黄色系', () => {
      const style = StockAlertEntity.getUrgencyStyle(4);
      expect(style.text).toContain('yellow');
    });

    it('7日は黄色系(境界)', () => {
      const style = StockAlertEntity.getUrgencyStyle(7);
      expect(style.text).toContain('yellow');
    });

    it('8日は緑系', () => {
      const style = StockAlertEntity.getUrgencyStyle(8);
      expect(style.text).toContain('green');
    });
  });

  describe('getDaysLabel', () => {
    it('期限超過は「期限超過」を返す', () => {
      const entity = new StockAlertEntity(createAlert({ isOverdue: true, daysUntilAlert: -1 }));
      expect(entity.getDaysLabel()).toBe('期限超過');
    });

    it('残り5日は「あと5日」を返す', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 5 }));
      expect(entity.getDaysLabel()).toBe('あと5日');
    });

    it('残り0日は「あと0日」を返す', () => {
      const entity = new StockAlertEntity(createAlert({ daysUntilAlert: 0, isOverdue: false }));
      expect(entity.getDaysLabel()).toBe('あと0日');
    });
  });
});
