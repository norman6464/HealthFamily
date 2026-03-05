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

describe('StockAlertEntity 優先度ソート・緊急度', () => {
  describe('sortByPriority', () => {
    it('空配列は空配列を返す', () => {
      expect(StockAlertEntity.sortByPriority([])).toEqual([]);
    });

    it('期限超過が先に来る', () => {
      const alerts = [
        createAlert({ medicationName: '薬B', daysUntilAlert: 5, isOverdue: false }),
        createAlert({ medicationName: '薬A', daysUntilAlert: -2, isOverdue: true }),
      ];
      const sorted = StockAlertEntity.sortByPriority(alerts);
      expect(sorted[0].medicationName).toBe('薬A');
      expect(sorted[1].medicationName).toBe('薬B');
    });

    it('残日数が少ない順にソートされる', () => {
      const alerts = [
        createAlert({ medicationName: '薬C', daysUntilAlert: 10 }),
        createAlert({ medicationName: '薬A', daysUntilAlert: 2 }),
        createAlert({ medicationName: '薬B', daysUntilAlert: 5 }),
      ];
      const sorted = StockAlertEntity.sortByPriority(alerts);
      expect(sorted.map((a) => a.medicationName)).toEqual(['薬A', '薬B', '薬C']);
    });

    it('元の配列を変更しない', () => {
      const alerts = [
        createAlert({ medicationName: '薬B', daysUntilAlert: 5 }),
        createAlert({ medicationName: '薬A', daysUntilAlert: 2 }),
      ];
      StockAlertEntity.sortByPriority(alerts);
      expect(alerts[0].medicationName).toBe('薬B');
    });
  });

  describe('getUrgencyLabel', () => {
    it('期限超過は「期限超過」を返す', () => {
      expect(StockAlertEntity.getUrgencyLabel(-1)).toBe('期限超過');
    });

    it('0日は「期限超過」を返す', () => {
      expect(StockAlertEntity.getUrgencyLabel(0)).toBe('期限超過');
    });

    it('1日は「残りわずか」を返す', () => {
      expect(StockAlertEntity.getUrgencyLabel(1)).toBe('残りわずか');
    });

    it('3日は「残りわずか」を返す(境界)', () => {
      expect(StockAlertEntity.getUrgencyLabel(3)).toBe('残りわずか');
    });

    it('4日は「注意」を返す', () => {
      expect(StockAlertEntity.getUrgencyLabel(4)).toBe('注意');
    });

    it('7日は「注意」を返す(境界)', () => {
      expect(StockAlertEntity.getUrgencyLabel(7)).toBe('注意');
    });

    it('8日は「余裕あり」を返す', () => {
      expect(StockAlertEntity.getUrgencyLabel(8)).toBe('余裕あり');
    });
  });

  describe('getUrgencyStyle', () => {
    it('期限超過は赤系スタイルを返す', () => {
      const style = StockAlertEntity.getUrgencyStyle(-1);
      expect(style.bg).toContain('red');
      expect(style.text).toContain('red');
    });

    it('残りわずかはオレンジ系スタイルを返す', () => {
      const style = StockAlertEntity.getUrgencyStyle(2);
      expect(style.bg).toContain('orange');
      expect(style.text).toContain('orange');
    });

    it('注意は黄色系スタイルを返す', () => {
      const style = StockAlertEntity.getUrgencyStyle(5);
      expect(style.bg).toContain('yellow');
      expect(style.text).toContain('yellow');
    });

    it('余裕ありは緑系スタイルを返す', () => {
      const style = StockAlertEntity.getUrgencyStyle(10);
      expect(style.bg).toContain('green');
      expect(style.text).toContain('green');
    });
  });
});
