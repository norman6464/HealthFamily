import { describe, it, expect } from 'vitest';
import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity.getVisitRegularityScore', () => {
  it('空配列は0', () => {
    expect(HospitalEntity.getVisitRegularityScore([])).toBe(0);
  });

  it('1件は100', () => {
    expect(HospitalEntity.getVisitRegularityScore([30])).toBe(100);
  });

  it('全て同じ間隔は100', () => {
    expect(HospitalEntity.getVisitRegularityScore([30, 30, 30])).toBe(100);
  });

  it('ばらつきがあるとスコアが下がる', () => {
    const result = HospitalEntity.getVisitRegularityScore([10, 30, 50]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });

  it('大きなばらつき', () => {
    const result = HospitalEntity.getVisitRegularityScore([1, 100]);
    expect(result).toBeLessThan(50);
  });

  it('結果は0-100の範囲', () => {
    const result = HospitalEntity.getVisitRegularityScore([7, 14, 21, 28]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('均一なほどスコアが高い', () => {
    const regular = HospitalEntity.getVisitRegularityScore([30, 30, 30]);
    const irregular = HospitalEntity.getVisitRegularityScore([5, 30, 60]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('2件で同じ間隔は100', () => {
    expect(HospitalEntity.getVisitRegularityScore([14, 14])).toBe(100);
  });
});

describe('HospitalEntity.getVisitRegularityScoreLabel', () => {
  it('スコア高は規則的', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(85)).toBe('規則的');
  });

  it('スコア中はやや不規則', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(60)).toBe('やや不規則');
  });

  it('スコア低は不規則', () => {
    expect(HospitalEntity.getVisitRegularityScoreLabel(30)).toBe('不規則');
  });
});
