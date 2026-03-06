import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleUtilizationRate', () => {
  it('両方0は0', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(0, 0)).toBe(0);
  });

  it('完了0は0', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(0, 10)).toBe(0);
  });

  it('予定0は0', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(5, 0)).toBe(0);
  });

  it('全完了は100', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(10, 10)).toBe(100);
  });

  it('半分は50', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(5, 10)).toBe(50);
  });

  it('超過も100', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(15, 10)).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = ScheduleEntity.getScheduleUtilizationRate(7, 20);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('完了が多いほどスコアが高い', () => {
    const low = ScheduleEntity.getScheduleUtilizationRate(2, 10);
    const high = ScheduleEntity.getScheduleUtilizationRate(8, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('1件中1件完了は100', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(1, 1)).toBe(100);
  });
});

describe('ScheduleEntity.getScheduleUtilizationRateLabel', () => {
  it('率高は高稼働', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(85)).toBe('高稼働');
  });

  it('率中は普通', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(60)).toBe('普通');
  });

  it('率低は低稼働', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(30)).toBe('低稼働');
  });
});
