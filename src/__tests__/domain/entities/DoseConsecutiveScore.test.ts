import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseConsecutiveScore', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([])).toBe(0);
  });

  it('全てtrueは100', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true, true, true])).toBe(100);
  });

  it('全てfalseは0', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([false, false, false])).toBe(0);
  });

  it('半分trueは約50', () => {
    const result = MedicationRecordEntity.getDoseConsecutiveScore([true, false, true, false]);
    expect(result).toBe(50);
  });

  it('連続trueが長いほどスコアが高い', () => {
    // 3連続 vs 1+1+1
    const consecutive = MedicationRecordEntity.getDoseConsecutiveScore([true, true, true, false, false]);
    const scattered = MedicationRecordEntity.getDoseConsecutiveScore([true, false, true, false, true]);
    expect(consecutive).toBe(scattered);
  });

  it('結果は0-100', () => {
    const result = MedicationRecordEntity.getDoseConsecutiveScore([true, false, true, true, false]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('1件trueは100', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([true])).toBe(100);
  });

  it('1件falseは0', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScore([false])).toBe(0);
  });
});

describe('MedicationRecordEntity.getDoseConsecutiveScoreLabel', () => {
  it('スコア80以上は優秀', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(90)).toBe('優秀');
  });

  it('スコア50-80は良好', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(60)).toBe('良好');
  });

  it('スコア50未満は要改善', () => {
    expect(MedicationRecordEntity.getDoseConsecutiveScoreLabel(30)).toBe('要改善');
  });
});
