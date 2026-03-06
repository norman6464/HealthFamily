import { describe, it, expect } from 'vitest';
import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity.getVisitRegularityScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(HospitalEntity.getVisitRegularityScore([])).toBe(0);
  });

  it('1件は100', () => {
    expect(HospitalEntity.getVisitRegularityScore([7])).toBe(100);
  });

  it('全て同じ値は100', () => {
    expect(HospitalEntity.getVisitRegularityScore([14, 14, 14, 14])).toBe(100);
  });

  it('2件同値は100', () => {
    expect(HospitalEntity.getVisitRegularityScore([30, 30])).toBe(100);
  });

  it('全て0は0', () => {
    expect(HospitalEntity.getVisitRegularityScore([0, 0, 0])).toBe(0);
  });

  it('わずかなばらつき', () => {
    const result = HospitalEntity.getVisitRegularityScore([29, 30, 31]);
    expect(result).toBeGreaterThan(90);
  });

  it('大きなばらつき', () => {
    const result = HospitalEntity.getVisitRegularityScore([1, 100]);
    expect(result).toBeLessThan(50);
  });

  it('均一なほどスコアが高い', () => {
    const regular = HospitalEntity.getVisitRegularityScore([10, 10, 10]);
    const irregular = HospitalEntity.getVisitRegularityScore([1, 10, 30]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('結果は0-100の範囲', () => {
    const result = HospitalEntity.getVisitRegularityScore([5, 15, 25, 35]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データで均一', () => {
    const data = Array(50).fill(14);
    expect(HospitalEntity.getVisitRegularityScore(data)).toBe(100);
  });

  it('大きな値', () => {
    expect(HospitalEntity.getVisitRegularityScore([365, 365])).toBe(100);
  });

  it('1と2の2件', () => {
    const result = HospitalEntity.getVisitRegularityScore([1, 2]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });
});

describe('HospitalEntity.getVisitRegularityScoreLabel - エッジケース', () => {
  it('スコア100は規則的', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(100)).toBe('規則的');
  });

  it('スコア80は規則的', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(80)).toBe('規則的');
  });

  it('スコア79はやや不規則', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(79)).toBe('やや不規則');
  });

  it('スコア50はやや不規則', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(50)).toBe('やや不規則');
  });

  it('スコア49は不規則', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(49)).toBe('不規則');
  });

  it('スコア0は不規則', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(0)).toBe('不規則');
  });
});
