import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleLoadBalance', () => {
  it('空配列は0', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([])).toBe(0);
  });

  it('1件は100', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([5])).toBe(100);
  });

  it('均等は100', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([3, 3, 3])).toBe(100);
  });

  it('偏りが大きいほどスコアが低い', () => {
    const balanced = ScheduleEntity.getScheduleLoadBalance([5, 5, 5]);
    const unbalanced = ScheduleEntity.getScheduleLoadBalance([1, 1, 10]);
    expect(balanced).toBeGreaterThan(unbalanced);
  });

  it('全て0は0', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([0, 0, 0])).toBe(0);
  });

  it('結果は0-100の範囲', () => {
    const result = ScheduleEntity.getScheduleLoadBalance([2, 5, 3]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2件均等は100', () => {
    expect(ScheduleEntity.getScheduleLoadBalance([10, 10])).toBe(100);
  });
});

describe('ScheduleEntity.getScheduleLoadBalanceLabel', () => {
  it('スコア高は均等', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(85)).toBe('均等');
  });

  it('スコア中はやや偏り', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(55)).toBe('やや偏り');
  });

  it('スコア低は偏り大', () => {
    expect(ScheduleEntity.getScheduleLoadBalanceLabel(25)).toBe('偏り大');
  });
});
