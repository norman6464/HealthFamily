import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleLoadBalance - エッジケース', () => {
  it('空配列は0', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([])).toBe(0);
  });

  it('1件・値0は0', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([0])).toBe(0);
  });

  it('1件・正値は100', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([5])).toBe(100);
  });

  it('2件均等は100', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([5, 5])).toBe(100);
  });

  it('全て0は0', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([0, 0, 0])).toBe(0);
  });

  it('全て同値は100', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([3, 3, 3, 3])).toBe(100);
  });

  it('極端な偏りは低スコア', () => {
    const result = ScheduleEntity.getScheduleLoadBalance([0, 0, 100]);
    expect(result).toBeLessThan(50);
  });

  it('均等なほどスコアが高い', () => {
    const balanced = ScheduleEntity.getScheduleLoadBalance([5, 5, 5, 5]);
    const unbalanced = ScheduleEntity.getScheduleLoadBalance([1, 1, 1, 20]);
    expect(balanced).toBeGreaterThan(unbalanced);
  });

  it('大量データで均一', () => {
    const data = Array(50).fill(10);
    expect(ScheduleEntity.getScheduleLoadBalance(data)).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = ScheduleEntity.getScheduleLoadBalance([2, 5, 8]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('やや偏り', () => {
    const result = ScheduleEntity.getScheduleLoadBalance([3, 5, 7]);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(100);
  });

  it('2件で大差', () => {
    const result = ScheduleEntity.getScheduleLoadBalance([1, 100]);
    expect(result).toBeLessThan(50);
  });
});

describe('ScheduleEntity.getScheduleLoadBalanceLabel - エッジケース', () => {
  it('100は均等', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(100)).toBe('均等');
  });

  it('80は均等', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(80)).toBe('均等');
  });

  it('79はやや偏り', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(79)).toBe('やや偏り');
  });

  it('50はやや偏り', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(50)).toBe('やや偏り');
  });

  it('49は偏り大', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(49)).toBe('偏り大');
  });

  it('0は偏り大', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(0)).toBe('偏り大');
  });
});
