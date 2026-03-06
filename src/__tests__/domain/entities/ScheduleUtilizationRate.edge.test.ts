import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleUtilizationRate - エッジケース', () => {
  it('両方0は0', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(0, 0)).toBe(0);
  });

  it('完了0・予定ありは0', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(0, 10)).toBe(0);
  });

  it('完了あり・予定0は0', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(5, 0)).toBe(0);
  });

  it('全完了は100', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(10, 10)).toBe(100);
  });

  it('1件中1件は100', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(1, 1)).toBe(100);
  });

  it('超過は100', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(20, 10)).toBe(100);
  });

  it('半分は50', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(5, 10)).toBe(50);
  });

  it('1/3', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(1, 3)).toBe(33);
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

  it('大きな値', () => {
    expect(ScheduleEntity.getScheduleUtilizationRate(100, 100)).toBe(100);
  });
});

describe('ScheduleEntity.getScheduleUtilizationRateLabel - エッジケース', () => {
  it('率100は高稼働', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(100)).toBe('高稼働');
  });

  it('率80は高稼働', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(80)).toBe('高稼働');
  });

  it('率79は普通', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(79)).toBe('普通');
  });

  it('率50は普通', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(50)).toBe('普通');
  });

  it('率49は低稼働', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(49)).toBe('低稼働');
  });

  it('率0は低稼働', () => {
    expect(ScheduleEntity.getScheduleUtilizationRateLabel(0)).toBe('低稼働');
  });
});
