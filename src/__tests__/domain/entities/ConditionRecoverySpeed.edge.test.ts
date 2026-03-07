import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionRecoverySpeed エッジケース', () => {
  it('2要素で低下のみは0', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([5, 3])).toBe(0);
  });

  it('2要素で上昇は0（低下がないため）', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([3, 5])).toBe(0);
  });

  it('全て1は0', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([1, 1, 1, 1])).toBe(0);
  });

  it('全て5は0', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([5, 5, 5, 5])).toBe(0);
  });

  it('1段階低下後に即回復', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([3, 2, 3]);
    expect(result).toBeGreaterThan(0);
  });

  it('最大落差からの即回復', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 1, 5]);
    expect(result).toBeGreaterThan(70);
  });

  it('低下後に部分回復のみ', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 1, 3]);
    expect(result).toBe(0);
  });

  it('連続低下は0', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([5, 4, 3, 2, 1])).toBe(0);
  });

  it('W型の回復パターン', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 2, 5, 2, 5]);
    expect(result).toBeGreaterThan(50);
  });

  it('多数の要素で安定', () => {
    const levels = Array.from({ length: 30 }, () => 3);
    expect(HealthLogEntity.getConditionRecoverySpeed(levels)).toBe(0);
  });

  it('結果は0以上100以下', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([4, 1, 2, 5, 3, 1, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 2, 4, 1, 5]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('低下と横ばい', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 2, 2, 2, 2]);
    expect(result).toBe(0);
  });

  it('小刻みな低下と回復', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([3, 2, 3, 2, 3, 2, 3]);
    expect(result).toBeGreaterThan(0);
  });

  it('1回低下後にゆっくり回復', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 1, 2, 3, 4, 5]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });

  it('同じ値の繰り返し後に低下と回復', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([3, 3, 3, 1, 3]);
    expect(result).toBeGreaterThan(0);
  });

  it('最低値からの回復パターン', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([1, 1, 1, 1, 1]);
    expect(result).toBe(0);
  });
});

describe('HealthLogEntity.getConditionRecoverySpeedLabel エッジケース', () => {
  it('境界値70は回復早い', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(70)).toBe('回復早い');
  });

  it('境界値40は普通', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(40)).toBe('普通');
  });

  it('境界値69は普通', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(69)).toBe('普通');
  });

  it('境界値39は回復遅い', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(39)).toBe('回復遅い');
  });

  it('0は回復遅い', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(0)).toBe('回復遅い');
  });

  it('100は回復早い', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(100)).toBe('回復早い');
  });
});
