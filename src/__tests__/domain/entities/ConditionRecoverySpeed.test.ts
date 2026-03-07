import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionRecoverySpeed', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([])).toBe(0);
  });

  it('1要素は0', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([3])).toBe(0);
  });

  it('常に同じ値は0（変動なし）', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([3, 3, 3, 3])).toBe(0);
  });

  it('低下後に即回復は高スコア', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 1, 5]);
    expect(result).toBeGreaterThan(70);
  });

  it('低下後に回復しないは低スコア', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 1, 1, 1]);
    expect(result).toBeLessThan(30);
  });

  it('結果は0-100', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([3, 1, 2, 4, 3]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([4, 2, 3, 5]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('徐々に回復は低〜中程度', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 1, 2, 3, 4, 5]);
    expect(result).toBeGreaterThan(20);
    expect(result).toBeLessThan(90);
  });

  it('低下のみは0', () => {
    expect(HealthLogEntity.getConditionRecoverySpeed([5, 4, 3, 2, 1])).toBe(0);
  });

  it('複数回の低下と回復', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 1, 5, 1, 5]);
    expect(result).toBeGreaterThan(50);
  });

  it('緩やかな低下後に急回復', () => {
    const result = HealthLogEntity.getConditionRecoverySpeed([5, 4, 3, 2, 5]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('HealthLogEntity.getConditionRecoverySpeedLabel', () => {
  it('70以上は回復早い', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(80)).toBe('回復早い');
  });

  it('40以上は普通', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(50)).toBe('普通');
  });

  it('40未満は回復遅い', () => {
    expect(HealthLogEntity.getConditionRecoverySpeedLabel(20)).toBe('回復遅い');
  });
});
