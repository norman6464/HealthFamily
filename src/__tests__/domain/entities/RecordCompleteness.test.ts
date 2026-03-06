import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('getRecordCompleteness', () => {
  it('記録日数0・期待日数0の場合0を返す', () => {
    expect(CalendarEntity.getRecordCompleteness(0, 0)).toBe(0);
  });

  it('記録日数0・期待日数正の場合0を返す', () => {
    expect(CalendarEntity.getRecordCompleteness(0, 30)).toBe(0);
  });

  it('全日記録の場合100を返す', () => {
    expect(CalendarEntity.getRecordCompleteness(30, 30)).toBe(100);
  });

  it('半分記録の場合50を返す', () => {
    expect(CalendarEntity.getRecordCompleteness(15, 30)).toBe(50);
  });

  it('記録が期待を超える場合100を返す', () => {
    expect(CalendarEntity.getRecordCompleteness(35, 30)).toBe(100);
  });

  it('1日中1日記録の場合100を返す', () => {
    expect(CalendarEntity.getRecordCompleteness(1, 1)).toBe(100);
  });

  it('期待日数が負の場合0を返す', () => {
    expect(CalendarEntity.getRecordCompleteness(5, -1)).toBe(0);
  });
});

describe('getRecordCompletenessLabel', () => {
  it('90以上は完璧を返す', () => {
    expect(CalendarEntity.getRecordCompletenessLabel(90)).toBe('完璧');
  });

  it('70以上90未満は良好を返す', () => {
    expect(CalendarEntity.getRecordCompletenessLabel(75)).toBe('良好');
  });

  it('50以上70未満はまずまずを返す', () => {
    expect(CalendarEntity.getRecordCompletenessLabel(55)).toBe('まずまず');
  });

  it('50未満は不足を返す', () => {
    expect(CalendarEntity.getRecordCompletenessLabel(30)).toBe('不足');
  });

  it('100は完璧を返す', () => {
    expect(CalendarEntity.getRecordCompletenessLabel(100)).toBe('完璧');
  });

  it('0は不足を返す', () => {
    expect(CalendarEntity.getRecordCompletenessLabel(0)).toBe('不足');
  });
});
