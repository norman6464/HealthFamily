import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseGapVariability - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(MedicationRecordEntity.getDoseGapVariability([])).toBe(0);
  });

  it('1件のみは0を返す', () => {
    expect(MedicationRecordEntity.getDoseGapVariability([120])).toBe(0);
  });

  it('2件で同じ値は0を返す', () => {
    expect(MedicationRecordEntity.getDoseGapVariability([60, 60])).toBe(0);
  });

  it('全て0は0を返す', () => {
    expect(MedicationRecordEntity.getDoseGapVariability([0, 0, 0])).toBe(0);
  });

  it('100件の同一値は0', () => {
    expect(MedicationRecordEntity.getDoseGapVariability(Array(100).fill(60))).toBe(0);
  });

  it('微小な差は低スコア', () => {
    const result = MedicationRecordEntity.getDoseGapVariability([60, 61, 59, 60]);
    expect(result).toBeLessThan(5);
  });

  it('極端な差は高スコア', () => {
    const result = MedicationRecordEntity.getDoseGapVariability([1, 1000, 1, 1000]);
    expect(result).toBeGreaterThan(80);
  });

  it('0-100の範囲内に収まる', () => {
    const result = MedicationRecordEntity.getDoseGapVariability([1, 10000]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('均一に近いほど低スコア', () => {
    const uniform = MedicationRecordEntity.getDoseGapVariability([60, 60, 60, 60]);
    const varied = MedicationRecordEntity.getDoseGapVariability([30, 90, 30, 90]);
    expect(uniform).toBeLessThan(varied);
  });

  it('小数値も正しく処理', () => {
    const result = MedicationRecordEntity.getDoseGapVariability([60.5, 61.0, 60.0]);
    expect(result).toBeLessThan(5);
  });
});

describe('MedicationRecordEntity.getDoseGapVariabilityLabel - 境界値', () => {
  it('スコア60は不規則(境界値)', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(60)).toBe('不規則');
  });

  it('スコア59はやや不規則', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(59)).toBe('やや不規則');
  });

  it('スコア30はやや不規則(境界値)', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(30)).toBe('やや不規則');
  });

  it('スコア29は規則的', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(29)).toBe('規則的');
  });

  it('スコア0は規則的', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(0)).toBe('規則的');
  });

  it('スコア100は不規則', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(100)).toBe('不規則');
  });
});
