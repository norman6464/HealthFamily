import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionImprovementScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getConditionImprovementScore([])).toBe(0);
  });

  it('1件は0', () => {
    expect(HealthLogEntity.getConditionImprovementScore([5])).toBe(0);
  });

  it('最大改善1→5は100', () => {
    expect(HealthLogEntity.getConditionImprovementScore([1, 5])).toBe(100);
  });

  it('最大悪化5→1は0', () => {
    expect(HealthLogEntity.getConditionImprovementScore([5, 1])).toBe(0);
  });

  it('変化なし3→3は50', () => {
    expect(HealthLogEntity.getConditionImprovementScore([3, 3])).toBe(50);
  });

  it('1段階改善', () => {
    const result = HealthLogEntity.getConditionImprovementScore([3, 4]);
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThan(100);
  });

  it('1段階悪化', () => {
    const result = HealthLogEntity.getConditionImprovementScore([3, 2]);
    expect(result).toBeLessThan(50);
    expect(result).toBeGreaterThan(0);
  });

  it('途中の値は無視される', () => {
    // 最初と最後だけを使う
    const a = HealthLogEntity.getConditionImprovementScore([1, 5]);
    const b = HealthLogEntity.getConditionImprovementScore([1, 3, 2, 5]);
    expect(a).toBe(b);
  });

  it('全て1は50', () => {
    expect(HealthLogEntity.getConditionImprovementScore([1, 1, 1])).toBe(50);
  });

  it('全て5は50', () => {
    expect(HealthLogEntity.getConditionImprovementScore([5, 5, 5])).toBe(50);
  });

  it('2段階改善', () => {
    const result = HealthLogEntity.getConditionImprovementScore([2, 4]);
    expect(result).toBe(75);
  });

  it('2段階悪化', () => {
    const result = HealthLogEntity.getConditionImprovementScore([4, 2]);
    expect(result).toBe(25);
  });

  it('結果は0-100の範囲', () => {
    const result = HealthLogEntity.getConditionImprovementScore([1, 3, 5, 2, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データ', () => {
    const data = Array(100).fill(3);
    data[0] = 1;
    data[99] = 5;
    expect(HealthLogEntity.getConditionImprovementScore(data)).toBe(100);
  });
});

describe('HealthLogEntity.getConditionImprovementScoreLabel - エッジケース', () => {
  it('スコア100は改善', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(100)).toBe('改善');
  });

  it('スコア70は改善', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(70)).toBe('改善');
  });

  it('スコア69は横ばい', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(69)).toBe('横ばい');
  });

  it('スコア30は横ばい', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(30)).toBe('横ばい');
  });

  it('スコア29は悪化', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(29)).toBe('悪化');
  });

  it('スコア0は悪化', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(0)).toBe('悪化');
  });
});
