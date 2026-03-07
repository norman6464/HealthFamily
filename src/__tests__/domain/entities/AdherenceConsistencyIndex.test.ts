import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity.getAdherenceConsistencyIndex', () => {
  it('空配列は0', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndex([])).toBe(0);
  });

  it('1件は100', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndex([80])).toBe(100);
  });

  it('同値は100', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndex([50, 50, 50])).toBe(100);
  });

  it('ばらつきが大きいと低い', () => {
    const consistent = AdherenceStatsEntity.getAdherenceConsistencyIndex([80, 82, 78, 81]);
    const inconsistent = AdherenceStatsEntity.getAdherenceConsistencyIndex([10, 90, 20, 80]);
    expect(consistent).toBeGreaterThan(inconsistent);
  });

  it('全て0は100', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndex([0, 0, 0])).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([30, 60, 90]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2件で大きな差', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([0, 100]);
    expect(result).toBeLessThan(50);
  });

  it('結果は整数', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([25, 75, 50]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('微小な差は高い一貫性', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([99, 100, 98, 100]);
    expect(result).toBeGreaterThan(90);
  });
});

describe('AdherenceStatsEntity.getAdherenceConsistencyIndexLabel', () => {
  it('高い値は安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(85)).toBe('安定');
  });

  it('中程度はやや不安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(55)).toBe('やや不安定');
  });

  it('低い値は不安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(25)).toBe('不安定');
  });
});
