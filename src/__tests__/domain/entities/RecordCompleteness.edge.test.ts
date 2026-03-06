import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('RecordCompleteness エッジケーステスト', () => {
  describe('getRecordCompleteness', () => {
    it('両方0の場合0を返す', () => {
      expect(CalendarEntity.getRecordCompleteness(0, 0)).toBe(0);
    });

    it('期待日数が負の場合0を返す', () => {
      expect(CalendarEntity.getRecordCompleteness(5, -1)).toBe(0);
    });

    it('記録日数が期待日数と等しい場合100を返す', () => {
      expect(CalendarEntity.getRecordCompleteness(30, 30)).toBe(100);
    });

    it('記録日数が期待日数を超える場合100を返す', () => {
      expect(CalendarEntity.getRecordCompleteness(50, 30)).toBe(100);
    });

    it('記録日数1・期待日数100の場合1を返す', () => {
      expect(CalendarEntity.getRecordCompleteness(1, 100)).toBe(1);
    });

    it('記録日数0・期待日数1の場合0を返す', () => {
      expect(CalendarEntity.getRecordCompleteness(0, 1)).toBe(0);
    });

    it('大きな数値でも正しく計算する', () => {
      expect(CalendarEntity.getRecordCompleteness(365, 365)).toBe(100);
    });

    it('小数の結果は四捨五入される', () => {
      expect(CalendarEntity.getRecordCompleteness(1, 3)).toBe(33);
    });

    it('2/3の場合67を返す', () => {
      expect(CalendarEntity.getRecordCompleteness(2, 3)).toBe(67);
    });
  });

  describe('getRecordCompletenessLabel', () => {
    it('境界値: 90は完璧を返す', () => {
      expect(CalendarEntity.getRecordCompletenessLabel(90)).toBe('完璧');
    });

    it('境界値: 89は良好を返す', () => {
      expect(CalendarEntity.getRecordCompletenessLabel(89)).toBe('良好');
    });

    it('境界値: 70は良好を返す', () => {
      expect(CalendarEntity.getRecordCompletenessLabel(70)).toBe('良好');
    });

    it('境界値: 69はまずまずを返す', () => {
      expect(CalendarEntity.getRecordCompletenessLabel(69)).toBe('まずまず');
    });

    it('境界値: 50はまずまずを返す', () => {
      expect(CalendarEntity.getRecordCompletenessLabel(50)).toBe('まずまず');
    });

    it('境界値: 49は不足を返す', () => {
      expect(CalendarEntity.getRecordCompletenessLabel(49)).toBe('不足');
    });

    it('100は完璧を返す', () => {
      expect(CalendarEntity.getRecordCompletenessLabel(100)).toBe('完璧');
    });

    it('0は不足を返す', () => {
      expect(CalendarEntity.getRecordCompletenessLabel(0)).toBe('不足');
    });
  });
});
