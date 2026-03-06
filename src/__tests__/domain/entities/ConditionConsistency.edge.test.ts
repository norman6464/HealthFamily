import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionConsistency - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(HealthLogEntity.getConditionConsistency([])).toBe(0);
  });

  it('1件は100を返す', () => {
    expect(HealthLogEntity.getConditionConsistency([5])).toBe(100);
  });

  it('2件で同じ値は100を返す', () => {
    expect(HealthLogEntity.getConditionConsistency([3, 3])).toBe(100);
  });

  it('2件で最大差(1と5)は0を返す', () => {
    // diff=4, avgDiff=4, 100-(4/4)*100=0
    expect(HealthLogEntity.getConditionConsistency([1, 5])).toBe(0);
  });

  it('2件で差1は75を返す', () => {
    // diff=1, avgDiff=1, 100-(1/4)*100=75
    expect(HealthLogEntity.getConditionConsistency([3, 4])).toBe(75);
  });

  it('2件で差2は50を返す', () => {
    // diff=2, avgDiff=2, 100-(2/4)*100=50
    expect(HealthLogEntity.getConditionConsistency([2, 4])).toBe(50);
  });

  it('全て同じ値(大量)は100', () => {
    const values = Array(100).fill(3);
    expect(HealthLogEntity.getConditionConsistency(values)).toBe(100);
  });

  it('交互に1と5の大量データは0', () => {
    const values = Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 1 : 5));
    expect(HealthLogEntity.getConditionConsistency(values)).toBe(0);
  });

  it('緩やかな上昇(1,2,3,4,5)は75', () => {
    // diffs: [1,1,1,1], avg=1, 100-(1/4)*100=75
    expect(HealthLogEntity.getConditionConsistency([1, 2, 3, 4, 5])).toBe(75);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = HealthLogEntity.getConditionConsistency([1, 5, 1, 5, 1, 5]);
    const result2 = HealthLogEntity.getConditionConsistency([3, 3, 3]);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
  });

  it('差が4を超えても0未満にならない', () => {
    // 条件値の範囲外の値でもclampされる
    expect(HealthLogEntity.getConditionConsistency([0, 10])).toBe(0);
  });

  it('小数値も正しく処理する', () => {
    const result = HealthLogEntity.getConditionConsistency([3.0, 3.5, 4.0]);
    expect(result).toBeGreaterThan(80);
  });

  it('安定→急変パターン', () => {
    const result = HealthLogEntity.getConditionConsistency([3, 3, 3, 3, 1]);
    // diffs: [0,0,0,2], avg=0.5, 100-(0.5/4)*100=88
    expect(result).toBe(88);
  });
});

describe('HealthLogEntity.getConditionConsistencyLabel - 境界値', () => {
  it('スコア100は安定', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(100)).toBe('安定');
  });

  it('スコア80は安定(境界値)', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(80)).toBe('安定');
  });

  it('スコア79は変動あり', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(79)).toBe('変動あり');
  });

  it('スコア50は変動あり(境界値)', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(50)).toBe('変動あり');
  });

  it('スコア49は不安定', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(49)).toBe('不安定');
  });

  it('スコア0は不安定', () => {
    expect(HealthLogEntity.getConditionConsistencyLabel(0)).toBe('不安定');
  });
});
