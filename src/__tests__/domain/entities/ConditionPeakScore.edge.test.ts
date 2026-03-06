import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionPeakScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getConditionPeakScore([])).toBe(0);
  });

  it('1件のみ', () => {
    expect(HealthLogEntity.getConditionPeakScore([3])).toBe(60);
  });

  it('最低値1のみ', () => {
    expect(HealthLogEntity.getConditionPeakScore([1])).toBe(20);
  });

  it('最高値5のみ', () => {
    expect(HealthLogEntity.getConditionPeakScore([5])).toBe(100);
  });

  it('全て同じ値3', () => {
    expect(HealthLogEntity.getConditionPeakScore([3, 3, 3])).toBe(60);
  });

  it('全て最低値1', () => {
    expect(HealthLogEntity.getConditionPeakScore([1, 1, 1])).toBe(20);
  });

  it('全て最高値5', () => {
    expect(HealthLogEntity.getConditionPeakScore([5, 5, 5])).toBe(100);
  });

  it('混合値で最大値を使う', () => {
    expect(HealthLogEntity.getConditionPeakScore([1, 2, 4, 2, 1])).toBe(80);
  });

  it('ピークが最後にある', () => {
    expect(HealthLogEntity.getConditionPeakScore([1, 2, 3, 4, 5])).toBe(100);
  });

  it('ピークが最初にある', () => {
    expect(HealthLogEntity.getConditionPeakScore([5, 4, 3, 2, 1])).toBe(100);
  });

  it('レベル2のピーク', () => {
    expect(HealthLogEntity.getConditionPeakScore([1, 2, 1])).toBe(40);
  });

  it('結果は0-100の範囲', () => {
    const result = HealthLogEntity.getConditionPeakScore([2, 3, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2件の配列', () => {
    expect(HealthLogEntity.getConditionPeakScore([2, 4])).toBe(80);
  });

  it('大量データ', () => {
    const data = Array(100).fill(3);
    data[50] = 5;
    expect(HealthLogEntity.getConditionPeakScore(data)).toBe(100);
  });
});

describe('HealthLogEntity.getConditionPeakScoreLabel - エッジケース', () => {
  it('スコア100は絶好調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(100)).toBe('絶好調');
  });

  it('スコア80は絶好調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(80)).toBe('絶好調');
  });

  it('スコア79は好調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(79)).toBe('好調');
  });

  it('スコア50は好調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(50)).toBe('好調');
  });

  it('スコア49は不調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(49)).toBe('不調');
  });

  it('スコア0は不調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(0)).toBe('不調');
  });
});
