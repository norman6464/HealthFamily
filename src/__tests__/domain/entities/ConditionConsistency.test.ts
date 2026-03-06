import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionConsistency', () => {
  it('空配列は0を返す', () => {
    expect(HealthLogEntity.getConditionConsistency([])).toBe(0);
  });

  it('1件のみは100を返す', () => {
    expect(HealthLogEntity.getConditionConsistency([3])).toBe(100);
  });

  it('全て同じ値なら100を返す', () => {
    expect(HealthLogEntity.getConditionConsistency([3, 3, 3, 3])).toBe(100);
  });

  it('連続する値の差が小さいほど高スコア', () => {
    const stable = HealthLogEntity.getConditionConsistency([3, 3, 4, 3, 3]);
    const unstable = HealthLogEntity.getConditionConsistency([1, 5, 1, 5, 1]);
    expect(stable).toBeGreaterThan(unstable);
  });

  it('最大差(1-5交互)は低スコア', () => {
    const result = HealthLogEntity.getConditionConsistency([1, 5, 1, 5]);
    expect(result).toBeLessThan(30);
  });

  it('緩やかに変化する値は中程度のスコア', () => {
    const result = HealthLogEntity.getConditionConsistency([1, 2, 3, 4, 5]);
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThan(100);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = HealthLogEntity.getConditionConsistency([1, 5, 1, 5, 1, 5]);
    const result2 = HealthLogEntity.getConditionConsistency([3, 3, 3]);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
  });

  it('2件で差1は高スコア', () => {
    const result = HealthLogEntity.getConditionConsistency([3, 4]);
    expect(result).toBeGreaterThan(70);
  });
});

describe('HealthLogEntity.getConditionConsistencyLabel', () => {
  it('スコア80以上は安定', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(80)).toBe('安定');
  });

  it('スコア50以上は変動あり', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(50)).toBe('変動あり');
  });

  it('スコア50未満は不安定', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(30)).toBe('不安定');
  });
});
